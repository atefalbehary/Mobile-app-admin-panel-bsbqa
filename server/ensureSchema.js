/**
 * Creates auxiliary tables used only by the Vite admin panel (Node API).
 * Safe to run on every startup (IF NOT EXISTS).
 */
export async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mobile_admin_notification_rules (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      trigger_type VARCHAR(80) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      is_enabled TINYINT(1) NOT NULL DEFAULT 1,
      audience VARCHAR(80) NOT NULL,
      delivery_channel VARCHAR(40) NOT NULL,
      template_title VARCHAR(255) NULL,
      template_title_ar VARCHAR(255) NULL,
      template_body TEXT NULL,
      template_body_ar TEXT NULL,
      last_triggered_at DATETIME NULL,
      trigger_count INT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mobile_admin_bell_notifications (
      id CHAR(36) NOT NULL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(40) NOT NULL DEFAULT 'info',
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      metadata JSON NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mobile_admin_chat_messages (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sender_id VARCHAR(64) NOT NULL,
      sender_name VARCHAR(255) NOT NULL,
      sender_type VARCHAR(40) NOT NULL,
      receiver_id VARCHAR(64) NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mobile_admin_push_campaigns (
      id CHAR(36) NOT NULL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      title_ar VARCHAR(255) NULL,
      body TEXT NULL,
      body_ar TEXT NULL,
      type VARCHAR(40) NOT NULL,
      target VARCHAR(80) NOT NULL,
      status VARCHAR(40) NOT NULL,
      source_type VARCHAR(40) NOT NULL,
      trigger_type VARCHAR(80) NULL,
      delivery_channel VARCHAR(40) NOT NULL,
      deep_link VARCHAR(1500) NULL,
      scheduled_at DATETIME NULL,
      sent_at DATETIME NULL,
      recipient_count INT UNSIGNED NOT NULL DEFAULT 0,
      open_rate DECIMAL(8,2) NULL,
      created_by VARCHAR(64) NULL,
      metadata JSON NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mobile_admin_user_notifications (
      id CHAR(36) NOT NULL PRIMARY KEY,
      campaign_id CHAR(36) NOT NULL,
      user_id BIGINT UNSIGNED NOT NULL,
      title VARCHAR(255) NOT NULL,
      title_ar VARCHAR(255) NULL,
      body TEXT NULL,
      body_ar TEXT NULL,
      channel VARCHAR(40) NOT NULL DEFAULT 'push',
      target VARCHAR(80) NOT NULL DEFAULT 'all',
      deep_link VARCHAR(1500) NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      read_at DATETIME NULL,
      sent_at DATETIME NULL,
      metadata JSON NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_mobile_admin_user_notifications_user_id (user_id),
      INDEX idx_mobile_admin_user_notifications_campaign_id (campaign_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mobile_admin_content_items (
      id CHAR(36) NOT NULL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      type VARCHAR(40) NOT NULL,
      status VARCHAR(40) NOT NULL,
      image_url VARCHAR(1500) NULL,
      link VARCHAR(1500) NULL,
      start_date DATE NULL,
      end_date DATE NULL,
      views INT UNSIGNED NOT NULL DEFAULT 0,
      clicks INT UNSIGNED NOT NULL DEFAULT 0,
      created_by VARCHAR(64) NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mobile_admin_crm_bookings (
      id CHAR(36) NOT NULL PRIMARY KEY,
      property_id BIGINT UNSIGNED NULL,
      property_title VARCHAR(500) NULL,
      user_id VARCHAR(64) NULL,
      user_name VARCHAR(255) NULL,
      date DATE NOT NULL,
      time VARCHAR(32) NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'pending',
      type VARCHAR(80) NOT NULL DEFAULT 'visit',
      notes TEXT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const [cols] = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'image_url'`
  );
  if (cols.length === 0) {
    await pool.query(`
      ALTER TABLE categories
        ADD COLUMN image_url VARCHAR(1500) NULL AFTER slug,
        ADD COLUMN unit_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER image_url,
        ADD COLUMN display_order INT UNSIGNED NOT NULL DEFAULT 0 AFTER unit_count
    `);
  }
}
