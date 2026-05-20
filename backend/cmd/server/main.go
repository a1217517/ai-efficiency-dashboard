package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/wan-admin/ai-efficiency-admin/internal/config"
	"github.com/wan-admin/ai-efficiency-admin/internal/handler"
	"github.com/wan-admin/ai-efficiency-admin/internal/middleware"
	"github.com/wan-admin/ai-efficiency-admin/internal/repository"
	"github.com/wan-admin/ai-efficiency-admin/internal/service"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	db, err := repository.NewDB(cfg.Database)
	if err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	teamSavingRepo := repository.NewTeamSavingRepository(db)
	tokenUsageRepo := repository.NewTokenUsageRepository(db)
	siliconContentRepo := repository.NewSiliconContentRepository(db)
	configRepo := repository.NewConfigRepository(db)
	userService := service.NewUserService(userRepo)
	teamSavingService := service.NewTeamSavingService(teamSavingRepo)
	tokenUsageService := service.NewTokenUsageService(tokenUsageRepo)
	siliconContentService := service.NewSiliconContentService(siliconContentRepo)
	configService := service.NewConfigService(configRepo)
	userHandler := handler.NewUserHandler(userService)
	teamSavingHandler := handler.NewTeamSavingHandler(teamSavingService)
	tokenUsageHandler := handler.NewTokenUsageHandler(tokenUsageService)
	siliconContentHandler := handler.NewSiliconContentHandler(siliconContentService)
	configHandler := handler.NewConfigHandler(configService)

	authHandler := handler.NewAuthHandler(userService, cfg.JWT)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://47.103.58.81:8081", "http://localhost:8081", "*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
	}))

	api := r.Group("/api/v1")
	{
		api.POST("/auth/login", authHandler.Login)
		api.POST("/auth/register", authHandler.Register)

		api.GET("/team-savings/all", teamSavingHandler.ListAll)

		// Token 使用量 - 公开接口
		api.GET("/token-usages/all", tokenUsageHandler.ListAll)
		api.GET("/silicon-contents/all", siliconContentHandler.ListAll)
		api.GET("/silicon-contents/stats", siliconContentHandler.Stats)

		// 阈值配置 - 公开读取
		api.GET("/thresholds", configHandler.GetThresholds)
		api.GET("/thresholds/:metric_type", configHandler.GetThreshold)

		auth := api.Group("/")
		auth.Use(middleware.JWTAuth(cfg.JWT.Secret))
		{
			auth.POST("/thresholds", configHandler.UpdateThreshold)
			auth.GET("/users", userHandler.List)
			auth.GET("/users/:id", userHandler.GetByID)
			auth.POST("/users", userHandler.Create)
			auth.PUT("/users/:id", userHandler.Update)
			auth.DELETE("/users/:id", userHandler.Delete)

			auth.GET("/team-savings", teamSavingHandler.List)
			auth.GET("/team-savings/:id", teamSavingHandler.GetByID)
			auth.POST("/team-savings", teamSavingHandler.Create)
			auth.PUT("/team-savings/:id", teamSavingHandler.Update)
			auth.DELETE("/team-savings/:id", teamSavingHandler.Delete)

			// Token 使用量管理
			auth.GET("/token-usages", tokenUsageHandler.List)
			auth.GET("/token-usages/:id", tokenUsageHandler.GetByID)
			auth.POST("/token-usages", tokenUsageHandler.Create)
			auth.PUT("/token-usages/:id", tokenUsageHandler.Update)
			auth.DELETE("/token-usages/:id", tokenUsageHandler.Delete)
			auth.POST("/token-usages/import", tokenUsageHandler.ImportExcel)

			// 硅含量管理
			auth.GET("/silicon-contents", siliconContentHandler.List)
			auth.GET("/silicon-contents/:id", siliconContentHandler.GetByID)
			auth.POST("/silicon-contents", siliconContentHandler.Create)
			auth.PUT("/silicon-contents/:id", siliconContentHandler.Update)
			auth.DELETE("/silicon-contents/:id", siliconContentHandler.Delete)
			auth.POST("/silicon-contents/import", siliconContentHandler.ImportExcel)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 后台管理服务启动在 http://0.0.0.0:%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("服务启动失败: %v", err)
	}
}
