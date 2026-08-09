-- =========================================================
-- Saman Adhikar Party (समान अधिकार पार्टी)
-- Complete Database Schema for MySQL / MariaDB / phpMyAdmin
-- =========================================================

CREATE DATABASE IF NOT EXISTS `saman_adhikar_party` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `saman_adhikar_party`;

-- 1. Press Releases Table
CREATE TABLE IF NOT EXISTS `press_releases` (
  `id` VARCHAR(32) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) DEFAULT NULL,
  `content` TEXT NOT NULL,
  `content_en` TEXT DEFAULT NULL,
  `category` VARCHAR(64) DEFAULT 'Public Announcement',
  `date` DATE NOT NULL,
  `location` VARCHAR(128) DEFAULT 'आगरा / नई दिल्ली',
  `spokesperson` VARCHAR(128) DEFAULT 'कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)',
  `image_url` TEXT DEFAULT NULL,
  `video_url` VARCHAR(255) DEFAULT NULL,
  `is_urgent` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Donations Table
CREATE TABLE IF NOT EXISTS `donations` (
  `id` VARCHAR(32) NOT NULL,
  `donor_name` VARCHAR(128) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `frequency` VARCHAR(32) DEFAULT 'one-time',
  `precinct` VARCHAR(128) DEFAULT 'आगरा HQ',
  `timestamp` DATETIME NOT NULL,
  `is_anonymous` TINYINT(1) DEFAULT 0,
  `message` TEXT DEFAULT NULL,
  `payment_method` VARCHAR(64) DEFAULT 'UPI / SBI',
  `utr_number` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Party Members Table
CREATE TABLE IF NOT EXISTS `members` (
  `id` VARCHAR(32) NOT NULL,
  `full_name` VARCHAR(128) NOT NULL,
  `email` VARCHAR(128) DEFAULT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `precinct` VARCHAR(128) DEFAULT NULL,
  `membership_tier` VARCHAR(64) DEFAULT 'सक्रिय कार्यकर्ता',
  `interests` TEXT DEFAULT NULL,
  `joined_date` DATE NOT NULL,
  `member_card_id` VARCHAR(64) NOT NULL,
  `membership_fee` DECIMAL(10,2) DEFAULT 0.00,
  `payment_method` VARCHAR(64) DEFAULT NULL,
  `utr_number` VARCHAR(64) DEFAULT NULL,
  `is_fee_paid` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `member_card_id_unique` (`member_card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Event RSVPs Table
CREATE TABLE IF NOT EXISTS `rsvps` (
  `id` VARCHAR(32) NOT NULL,
  `event_id` VARCHAR(64) NOT NULL,
  `event_title` VARCHAR(255) NOT NULL,
  `attendee_name` VARCHAR(128) NOT NULL,
  `attendee_email` VARCHAR(128) DEFAULT NULL,
  `guests_count` INT DEFAULT 1,
  `qr_code_token` VARCHAR(64) NOT NULL,
  `timestamp` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Seed Data: Press Releases
INSERT INTO `press_releases` (`id`, `title`, `title_en`, `content`, `category`, `date`, `location`, `spokesperson`, `image_url`, `is_urgent`) VALUES
('PR-10001', 'आरक्षण प्रणाली समाप्त करने एवं योग्यता-आधारित अवसर प्रदान करने हेतु ऐतिहासिक ज्ञापन प्रस्तुत', 'Historical Memorandum Submitted to End Reservation System and Ensure Merit-Based Rights', 'समान अधिकार पार्टी के राष्ट्रीय अध्यक्ष कुलदीप शर्मा जी के नेतृत्व में प्रतिनिधिमंडल ने प्रशासन को ज्ञापन सौंपा। पार्टी का स्पष्ट मत है कि जातिगत आरक्षण समाप्त कर आर्थिक एवं योग्यता-आधारित व्यवस्था लागू की जाए।', 'National Agenda', '2026-07-28', 'आगरा मुख्यालय', 'कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)', 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80', 1),
('PR-10002', 'मथुरा में भव्य श्री कृष्ण मंदिर निर्माण एवं गौमाता को राष्ट्रमाता घोषित करने हेतु हुंकार', 'Pledge for Shri Krishna Temple Construction in Mathura and Declaring Gaumata as Rashtramata', 'मथुरा धाम में आयोजित विशाल जनसभा को संबोधित करते हुए कुलदीप शर्मा जी ने कहा कि भारत को सांस्कृतिक हिंदू राष्ट्र बनाना और गौमाता की रक्षा करना हमारी सर्वोच्च प्राथमिकता है।', 'Press Briefing', '2026-07-25', 'मथुरा धाम', 'कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)', 'https://images.unsplash.com/photo-1590077428593-a55bb07c4665?auto=format&fit=crop&w=1200&q=80', 0);
