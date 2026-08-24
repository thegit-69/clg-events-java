package com.dasarath.clg_events_backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

@SpringBootApplication
public class ClgEventsBackendApplication {

	public static void main(String[] args) {
		loadEnvironmentVariables();
		SpringApplication.run(ClgEventsBackendApplication.class, args);
	}

	private static void loadEnvironmentVariables() {
		// Load .env from current directory (e.g. backend/)
		Dotenv dotenv = Dotenv.configure()
				.ignoreIfMissing()
				.load();

		dotenv.entries().forEach(entry -> {
			if (System.getProperty(entry.getKey()) == null) {
				System.setProperty(entry.getKey(), entry.getValue());
			}
		});

		// If running from project root or subfolder, check parent folder fallback
		if (dotenv.entries().isEmpty() && new File("../.env").exists()) {
			Dotenv parentDotenv = Dotenv.configure()
					.directory("../")
					.ignoreIfMissing()
					.load();
			parentDotenv.entries().forEach(entry -> {
				if (System.getProperty(entry.getKey()) == null) {
					System.setProperty(entry.getKey(), entry.getValue());
				}
			});
		}
	}
}
