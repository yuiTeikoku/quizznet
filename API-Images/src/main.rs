use actix_cors::Cors;
use actix_multipart::Multipart;
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use futures_util::StreamExt as _; // для .next() у Field
use futures_util::TryStreamExt as _; // для .try_next() у Multipart
use reqwest::multipart::{Form, Part};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

struct AppState {
    images: Mutex<Vec<String>>,
}

#[derive(Serialize)]
struct ImageListResponse {
    images: Vec<String>,
}

async fn upload_image(
    mut payload: Multipart,
    state: web::Data<AppState>,
) -> Result<HttpResponse, actix_web::Error> {
    let pictrs_url = std::env::var("PICTRS_URL").unwrap_or_else(|_| "http://pict-rs:8080".into());
    println!("[upload] pictrs_url: {}", pictrs_url);

    let mut image_data = None;

    // Перебираем поля формы
    while let Ok(Some(mut field)) = payload.try_next().await {
        let content_disposition = field.content_disposition();
        let field_name = content_disposition.get_name().unwrap_or("unknown");
        println!("[upload] Found field: {}", field_name);

        if field_name == "image" {
            let mut bytes = Vec::new();
            // Читаем чанки из поля
            while let Some(chunk) = field.next().await {
                let chunk = chunk?;
                bytes.extend_from_slice(&chunk);
            }
            println!("[upload] Read {} bytes", bytes.len());
            image_data = Some(bytes);
            break;
        }
    }

    let image_data = image_data.ok_or_else(|| {
        println!("[upload] ERROR: missing 'image' field");
        actix_web::error::ErrorBadRequest("Missing field 'image'")
    })?;

    let client = reqwest::Client::new();
    let form = Form::new().part("images[]", Part::bytes(image_data).file_name("image.jpg"));

    println!("[upload] Sending to pict-rs...");
    let resp = client
        .post(&format!("{}/image", pictrs_url))
        .multipart(form)
        .send()
        .await
        .map_err(|e| {
            println!("[upload] Request error: {}", e);
            actix_web::error::ErrorInternalServerError(e)
        })?;

    let status = resp.status();
    let response_text = resp
        .text()
        .await
        .unwrap_or_else(|e| format!("<error: {}>", e));
    println!(
        "[upload] pict-rs status: {}, body: {}",
        status, response_text
    );

    if !status.is_success() {
        return Ok(
            HttpResponse::InternalServerError().body(format!("pict-rs error: {}", response_text))
        );
    }

    #[derive(Deserialize)]
    struct PictrsResponse {
        files: Vec<FileInfo>,
    }
    #[derive(Deserialize)]
    struct FileInfo {
        file: String,
    }

    let json: PictrsResponse = serde_json::from_str(&response_text)
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;
    let alias = json.files[0].file.clone();
    println!("[upload] OK, alias: {}", alias);

    {
        let mut images = state.images.lock().unwrap();
        images.push(alias.clone());
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({ "alias": alias })))
}

async fn list_images(state: web::Data<AppState>) -> impl Responder {
    let images = state.images.lock().unwrap();
    HttpResponse::Ok().json(ImageListResponse {
        images: images.clone(),
    })
}

async fn download_image(
    path: web::Path<String>,
    state: web::Data<AppState>,
) -> Result<HttpResponse, actix_web::Error> {
    let alias = path.into_inner();
    let pictrs_url = std::env::var("PICTRS_URL").unwrap_or_else(|_| "http://pict-rs:8080".into());

    {
        let images = state.images.lock().unwrap();
        if !images.contains(&alias) {
            return Ok(HttpResponse::NotFound().body("Image not found"));
        }
    }

    let client = reqwest::Client::new();
    let resp = client
        .get(&format!("{}/image/original/{}", pictrs_url, alias))
        .send()
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    if resp.status() != StatusCode::OK {
        return Ok(HttpResponse::NotFound().body("Image not found in storage"));
    }

    let bytes = resp.bytes().await.unwrap();
    let content_type = mime_guess::from_path(&alias).first_or_octet_stream();

    Ok(HttpResponse::Ok()
        .content_type(content_type.as_ref())
        .body(bytes))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let state = web::Data::new(AppState {
        images: Mutex::new(Vec::new()),
    });

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://10.65.65.210:3000")
            .allowed_methods(vec!["GET", "POST", "PUT"])
            .allow_any_header()
            .max_age(3600);

        App::new().wrap(cors).app_data(state.clone()).service(
            web::scope("/api")
                .route("/upload", web::post().to(upload_image))
                .route("/images/all", web::get().to(list_images))
                .route("/images/{id}", web::get().to(download_image)),
        )
    })
    .bind(("0.0.0.0", 3001))?
    .run()
    .await
}
