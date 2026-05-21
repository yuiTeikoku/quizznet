using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace QuizzNetBackend.Dbo.Models;

public partial class QuizzContext : DbContext
{
    public QuizzContext(DbContextOptions<QuizzContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Game> Games { get; set; }

    public virtual DbSet<Question> Questions { get; set; }

    public virtual DbSet<Quizz> Quizzs { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserAnswer> UserAnswers { get; set; }

    public virtual DbSet<UsersGame> UsersGames { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("uuid-ossp");

        modelBuilder.Entity<Game>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("game_logic_pk");

            entity.ToTable("game");

            entity.Property(e => e.Id)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id");
            entity.Property(e => e.CreateAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("create_at");
            entity.Property(e => e.LeaderUserId).HasColumnName("leader_user_id");
            entity.Property(e => e.LinkKey)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("link_key");
            entity.Property(e => e.QuestionsId)
                .HasDefaultValueSql("'{}'::bigint[]")
                .HasColumnName("questions_id");
            entity.Property(e => e.QuizzId).HasColumnName("quizz_id");
            entity.Property(e => e.QuizzState)
                .HasDefaultValueSql("'Registry'::text")
                .HasColumnName("quizz_state");

            entity.HasOne(d => d.LeaderUser).WithMany(p => p.Games)
                .HasForeignKey(d => d.LeaderUserId)
                .HasConstraintName("game_users_fk");

            entity.HasOne(d => d.Quizz).WithMany(p => p.Games)
                .HasForeignKey(d => d.QuizzId)
                .HasConstraintName("game_quizz_fk");
        });

        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("question_pk");

            entity.ToTable("question");

            entity.Property(e => e.Id)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id");
            entity.Property(e => e.AnswerData).HasColumnName("answer_data");
            entity.Property(e => e.AnswerType).HasColumnName("answer_type");
            entity.Property(e => e.Order).HasColumnName("order");
            entity.Property(e => e.Points)
                .HasDefaultValue(1L)
                .HasColumnName("points");
            entity.Property(e => e.QuestionData).HasColumnName("question_data");
            entity.Property(e => e.QuestionType).HasColumnName("question_type");
            entity.Property(e => e.QuizzId).HasColumnName("quizz_id");
            entity.Property(e => e.CorrectAnswer).HasColumnName("correct_answer");

            entity.HasOne(d => d.Quizz).WithMany(p => p.Questions)
                .HasForeignKey(d => d.QuizzId)
                .HasConstraintName("question_quizz_fk");
        });

        modelBuilder.Entity<Quizz>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("survey_pk");

            entity.ToTable("quizz");

            entity.Property(e => e.Id)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Name).HasColumnName("name");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("users_pk");

            entity.ToTable("users");

            entity.Property(e => e.Id)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id");
            entity.Property(e => e.LastAuth)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("last_auth");
            entity.Property(e => e.Nickname).HasColumnName("nickname");
            entity.Property(e => e.Password)
                .HasDefaultValueSql("''::text")
                .HasColumnName("password");
            entity.Property(e => e.UserType)
                .HasDefaultValueSql("'User'::text")
                .HasColumnName("user_type");
        });

        modelBuilder.Entity<UserAnswer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("user_answers_pk");

            entity.ToTable("user_answers");

            entity.Property(e => e.Id)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id");
            entity.Property(e => e.Answer)
                .HasDefaultValueSql("''::text")
                .HasColumnName("answer");
            entity.Property(e => e.GameId).HasColumnName("game_id");
            entity.Property(e => e.QuestionId).HasColumnName("question_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Game).WithMany(p => p.UserAnswers)
                .HasForeignKey(d => d.GameId)
                .HasConstraintName("user_answers_game_fk");

            entity.HasOne(d => d.Question).WithMany(p => p.UserAnswers)
                .HasForeignKey(d => d.QuestionId)
                .HasConstraintName("user_answers_question_fk");

            entity.HasOne(d => d.User).WithMany(p => p.UserAnswers)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("user_answers_users_fk");
        });

        modelBuilder.Entity<UsersGame>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("users_game_pk");

            entity.ToTable("users_game");

            entity.Property(e => e.Id)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id");
            entity.Property(e => e.GameId).HasColumnName("game_id");
            entity.Property(e => e.Score).HasColumnName("score");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Game).WithMany(p => p.UsersGames)
                .HasForeignKey(d => d.GameId)
                .HasConstraintName("users_game_game_fk");

            entity.HasOne(d => d.User).WithMany(p => p.UsersGames)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("users_game_users_fk");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
