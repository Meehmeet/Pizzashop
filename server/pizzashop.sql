-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: 10.115.2.18    Database: pizzashop
-- ------------------------------------------------------
-- Server version	8.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ingredients`
--

DROP TABLE IF EXISTS `ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `category` enum('base','sauce','cheese','meat','vegetable','other') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingredients`
--

LOCK TABLES `ingredients` WRITE;
/*!40000 ALTER TABLE `ingredients` DISABLE KEYS */;
INSERT INTO `ingredients` VALUES (1,'Tomatensoße',0.00,'sauce','2025-09-11 12:38:29'),(2,'Knoblauchsoße',0.50,'sauce','2025-09-11 12:38:29'),(3,'BBQ Soße',0.50,'sauce','2025-09-11 12:38:29'),(4,'Mozzarella',0.00,'cheese','2025-09-11 12:38:29'),(5,'Gouda',0.50,'cheese','2025-09-11 12:38:29'),(6,'Parmesan',1.00,'cheese','2025-09-11 12:38:29'),(7,'Salami',1.50,'meat','2025-09-11 12:38:29'),(8,'Schinken',1.50,'meat','2025-09-11 12:38:29'),(9,'Döner-Fleisch',2.00,'meat','2025-09-11 12:38:29'),(10,'Champignons',1.00,'vegetable','2025-09-11 12:38:29'),(11,'Paprika',1.00,'vegetable','2025-09-11 12:38:29'),(12,'Zwiebeln',0.50,'vegetable','2025-09-11 12:38:29'),(13,'Ananas',1.00,'vegetable','2025-09-11 12:38:29'),(14,'Oliven',1.00,'vegetable','2025-09-11 12:38:29'),(15,'Rucola',1.50,'vegetable','2025-09-11 12:38:29'),(16,'Oregano',0.00,'other','2025-09-11 12:38:29'),(17,'Basilikum',0.50,'other','2025-09-11 12:38:29');
/*!40000 ALTER TABLE `ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `pizza_id` int DEFAULT NULL,
  `custom_ingredients` text,
  `quantity` int DEFAULT '1',
  `item_price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `pizza_id` (`pizza_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`pizza_id`) REFERENCES `pizzas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (27,10,NULL,'{\"selectedIngredients\":[],\"type\":\"custom_pizza\",\"pizza_name\":\"Custom Pizza\"}',2,8.50),(28,10,NULL,'{\"selectedIngredients\":[],\"type\":\"custom_pizza\",\"pizza_name\":\"Custom Pizza\"}',4,9.50),(29,11,NULL,'{\"selectedIngredients\":[],\"type\":\"custom_pizza\",\"pizza_name\":\"Custom Pizza\"}',1,8.50),(30,12,NULL,'{\"selectedIngredients\":[],\"type\":\"custom_pizza\",\"pizza_name\":\"Custom Pizza\"}',1,8.50),(31,13,NULL,'{\"pizza_name\":\"Pizza Margherita\",\"type\":\"regular_pizza\"}',1,8.50),(32,13,NULL,'{\"pizza_name\":\"Pizza Funghi\",\"type\":\"regular_pizza\"}',1,9.50),(33,13,NULL,'{\"pizza_name\":\"Pizza Hawaii\",\"type\":\"regular_pizza\"}',1,10.50),(34,14,NULL,'{\"pizza_name\":\"Pizza Margherita\",\"type\":\"regular_pizza\"}',2,8.50),(35,14,NULL,'{\"pizza_name\":\"Pizza Döner\",\"type\":\"regular_pizza\"}',1,12.00),(36,14,NULL,'{\"selectedIngredients\":[{\"id\":5,\"name\":\"Gouda\",\"price\":0.5,\"preis\":0.5,\"category\":\"cheese\"},{\"id\":8,\"name\":\"Schinken\",\"price\":1.5,\"preis\":1.5,\"category\":\"meat\"},{\"id\":7,\"name\":\"Salami\",\"price\":1.5,\"preis\":1.5,\"category\":\"meat\"}],\"type\":\"custom_pizza\",\"pizza_name\":\"Custom Pizza\"}',1,10.50);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `status` enum('pending','accepted','preparing','ready','delivered','rejected') DEFAULT 'pending',
  `delivery_address` text,
  `order_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `rejection_reason` text,
  `status_updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_date` (`order_date`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (10,11,55.00,'pending','Hohenems 123, 123 Hohenems, hohenems [STORNIERT]','2025-09-25 13:39:10',NULL,NULL),(11,11,8.50,'pending','Hohenems 123, 6850 Hohenems, Hohenems [STORNIERT]','2025-09-25 13:52:25',NULL,NULL),(12,11,8.50,'pending','o o, oo o, o [STORNIERT]','2025-09-25 13:56:31',NULL,NULL),(13,11,28.50,'pending','j j, j j, j','2025-09-25 14:05:16',NULL,NULL),(14,12,39.50,'pending','Hohenems Hohenems, HOhensm hohenems, hohenems','2025-10-02 13:33:56',NULL,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pizza_ingredients`
--

DROP TABLE IF EXISTS `pizza_ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pizza_ingredients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pizza_id` int DEFAULT NULL,
  `ingredient_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pizza_id` (`pizza_id`),
  KEY `ingredient_id` (`ingredient_id`),
  CONSTRAINT `pizza_ingredients_ibfk_1` FOREIGN KEY (`pizza_id`) REFERENCES `pizzas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pizza_ingredients_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pizza_ingredients`
--

LOCK TABLES `pizza_ingredients` WRITE;
/*!40000 ALTER TABLE `pizza_ingredients` DISABLE KEYS */;
INSERT INTO `pizza_ingredients` VALUES (1,1,1),(2,1,4),(3,1,16),(4,2,1),(5,2,4),(6,2,10),(7,2,16),(8,3,1),(9,3,4),(10,3,8),(11,3,13),(12,4,2),(13,4,4),(14,4,9),(15,4,12),(16,5,1),(17,5,4),(18,5,7),(19,5,11);
/*!40000 ALTER TABLE `pizza_ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pizzas`
--

DROP TABLE IF EXISTS `pizzas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pizzas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `base_price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_custom` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pizzas`
--

LOCK TABLES `pizzas` WRITE;
/*!40000 ALTER TABLE `pizzas` DISABLE KEYS */;
INSERT INTO `pizzas` VALUES (1,'Pizza Margherita','Der Klassiker mit Tomatensoße und Mozzarella',8.50,'/images/margherita.jpg',0,'2025-09-11 12:38:29'),(2,'Pizza Funghi','Mit frischen Champignons und Kräutern',9.50,'/images/funghi.jpg',0,'2025-09-11 12:38:29'),(3,'Pizza Hawaii','Mit Ananas und Schinken - der Streitfall',10.50,'/images/hawaii.jpg',0,'2025-09-11 12:38:29'),(4,'Pizza Döner','Mit Döner-Fleisch, Zwiebeln und Knoblauchsoße',12.00,'/images/doener.jpg',0,'2025-09-11 12:38:29'),(5,'Pizza Salami','Mit würziger Salami und Paprika',9.00,'/images/salami.jpg',0,'2025-09-11 12:38:29'),(6,'Custom Pizza','Stelle deine eigene Pizza zusammen',7.00,'/images/custom.jpg',0,'2025-09-11 12:38:29');
/*!40000 ALTER TABLE `pizzas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `rating` int DEFAULT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (3,11,2,'super','2025-09-25 12:57:36'),(4,12,4,'süper','2025-10-02 13:34:17');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_created` (`created_at`),
  KEY `idx_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (11,'Lukas_Schuler','lukasschuler@gmail.com','$2b$10$ul951UUUdARnU7rXVvTnv.19x7XkUu./bv5AfLb8U653euknSqI.u','2025-09-25 12:17:16'),(12,'Hallo','Hallo@gmail.com','$2b$10$Gt/VpofeLZfuGWHDW.eJlu.khClzzcWnBAIjbQJYpi6EScqL5Lv3i','2025-10-02 13:33:17'),(13,'root','root@gmail.com','$2b$10$XtTyXWDxgPHaZq8nbfq2nuBK0nlkG.q5236h5/RokekJgjabw/nIe','2025-10-03 10:51:31'),(14,'hallo2','hallo2@gmail.com','$2b$10$y4F9/4B77tRfzefjOpS8Xuo.pKGFRGS766A01.Vbik0paMG3.mhKy','2025-10-03 10:53:51');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'pizzashop'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-03 13:27:11
