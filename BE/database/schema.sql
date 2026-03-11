CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    status ENUM('active','inactive','banned') DEFAULT 'active',
    email_verified TINYINT(1) DEFAULT 0,

    last_login DATETIME DEFAULT NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until DATETIME DEFAULT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL
);

CREATE TABLE user_profiles (
    user_id INT PRIMARY KEY,

    full_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    avatar_public_id VARCHAR(100),

    gender ENUM('Nam','Nữ','Khác'),
    bio TEXT,
    country VARCHAR(100),

    level INT DEFAULT 1,
    exp_points INT DEFAULT 0,
    streak_days INT DEFAULT 0,
    total_study_time INT DEFAULT 0,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE oauth_accounts (
    oauth_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    provider ENUM('google','facebook','github') NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,

    access_token TEXT,
    refresh_token TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(provider, provider_user_id),
    UNIQUE(user_id, provider),

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE refresh_tokens (
    token_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,

    device_info VARCHAR(255),
    ip_address VARCHAR(45),

    expires_at DATETIME NOT NULL,
    revoked TINYINT(1) DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE login_history (
    login_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT,

    ip_address VARCHAR(45),
    device_info VARCHAR(255),

    login_status ENUM('success','failed'),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE
);

CREATE TABLE permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE
);

CREATE TABLE user_roles (
    user_id INT,
    role_id INT,

    PRIMARY KEY(user_id, role_id),

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

CREATE TABLE role_permissions (
    role_id INT,
    permission_id INT,

    PRIMARY KEY(role_id, permission_id),

    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
);

CREATE TABLE user_follows (
    follower_id INT,
    following_id INT,

    PRIMARY KEY(follower_id, following_id),

    FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(user_id) ON DELETE CASCADE,

    CHECK (follower_id <> following_id)
);

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT,

    content TEXT,
    type ENUM('system','friend','achievement','reminder'),

    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE topics (
    topic_id INT AUTO_INCREMENT PRIMARY KEY,

    topic_name VARCHAR(100) NOT NULL,
    description TEXT,

    difficulty_level ENUM('beginner','intermediate','advanced'),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lessons (
    lesson_id INT AUTO_INCREMENT PRIMARY KEY,

    lesson_name VARCHAR(255) NOT NULL,
    topic_id INT,
    lesson_order INT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(topic_id, lesson_order),

    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE SET NULL
);

CREATE TABLE vocabulary (
    vocab_id INT AUTO_INCREMENT PRIMARY KEY,

    word VARCHAR(100) NOT NULL,
    phonetic VARCHAR(100),

    meaning_vi TEXT NOT NULL,
    meaning_en TEXT,

    part_of_speech VARCHAR(50),

    audio_url VARCHAR(255),
    audio_public_id VARCHAR(100),

    lesson_id INT,
    created_by INT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE(word, lesson_id),

    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE quizzes (
    quiz_id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    type ENUM('vocab','grammar','listening') DEFAULT 'vocab',

    lesson_id INT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE SET NULL
);

CREATE TABLE quiz_questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,

    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,

    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

CREATE TABLE quiz_answers (
    answer_id INT AUTO_INCREMENT PRIMARY KEY,

    question_id INT NOT NULL,
    answer_text VARCHAR(255) NOT NULL,

    is_correct TINYINT(1) DEFAULT 0,

    FOREIGN KEY (question_id) REFERENCES quiz_questions(question_id) ON DELETE CASCADE
);

CREATE TABLE user_quiz_results (
    result_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    quiz_id INT NOT NULL,

    score DECIMAL(5,2),
    correct_answers INT,
    total_questions INT,
    time_taken INT,

    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

CREATE TABLE user_vocab_progress (
    user_id INT,
    vocab_id INT,

    review_count INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    wrong_count INT DEFAULT 0,

    mastery_score DECIMAL(5,2) DEFAULT 0.00,

    last_reviewed DATETIME,
    next_review DATETIME,

    PRIMARY KEY(user_id, vocab_id),

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (vocab_id) REFERENCES vocabulary(vocab_id) ON DELETE CASCADE
);

CREATE TABLE badges (
    badge_id INT AUTO_INCREMENT PRIMARY KEY,
    badge_name VARCHAR(100),
    description TEXT
);

CREATE TABLE user_badges (
    user_id INT,
    badge_id INT,

    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY(user_id, badge_id),

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(badge_id) ON DELETE CASCADE
);

