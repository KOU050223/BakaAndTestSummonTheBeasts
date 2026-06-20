# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_21_000002) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "answer_sheets", force: :cascade do |t|
    t.jsonb "ai_grading"
    t.datetime "created_at", null: false
    t.bigint "exam_id", null: false
    t.text "ocr_text"
    t.string "status", default: "pending", null: false
    t.bigint "student_id", null: false
    t.datetime "updated_at", null: false
    t.index ["exam_id", "student_id"], name: "index_answer_sheets_on_exam_id_and_student_id", unique: true
    t.index ["exam_id"], name: "index_answer_sheets_on_exam_id"
    t.index ["status"], name: "index_answer_sheets_on_status"
    t.index ["student_id"], name: "index_answer_sheets_on_student_id"
  end

  create_table "battle_fields", force: :cascade do |t|
    t.bigint "battle_id", null: false
    t.float "center_x", default: 0.0, null: false
    t.float "center_z", default: 0.0, null: false
    t.datetime "created_at", null: false
    t.float "radius", default: 3.0, null: false
    t.string "subject", null: false
    t.datetime "updated_at", null: false
    t.index ["battle_id", "subject"], name: "index_battle_fields_on_battle_id_and_subject", unique: true
    t.index ["battle_id"], name: "index_battle_fields_on_battle_id"
  end

  create_table "battle_logs", force: :cascade do |t|
    t.string "action", null: false
    t.bigint "actor_id", null: false
    t.bigint "battle_id", null: false
    t.datetime "created_at", null: false
    t.integer "damage", null: false
    t.bigint "target_id", null: false
    t.integer "turn", null: false
    t.datetime "updated_at", null: false
    t.index ["actor_id"], name: "index_battle_logs_on_actor_id"
    t.index ["battle_id", "turn"], name: "index_battle_logs_on_battle_id_and_turn"
    t.index ["battle_id"], name: "index_battle_logs_on_battle_id"
    t.index ["target_id"], name: "index_battle_logs_on_target_id"
  end

  create_table "battle_players", force: :cascade do |t|
    t.bigint "battle_id", null: false
    t.datetime "created_at", null: false
    t.boolean "leader", default: false, null: false
    t.bigint "student_id", null: false
    t.string "team_id"
    t.datetime "updated_at", null: false
    t.index ["battle_id", "student_id"], name: "index_battle_players_on_battle_id_and_student_id", unique: true
    t.index ["battle_id", "team_id"], name: "index_battle_players_on_battle_id_and_team_id"
    t.index ["battle_id"], name: "index_battle_players_on_battle_id"
    t.index ["student_id"], name: "index_battle_players_on_student_id"
  end

  create_table "battle_summons", force: :cascade do |t|
    t.bigint "battle_player_id", null: false
    t.datetime "created_at", null: false
    t.integer "initial_attack", null: false
    t.integer "initial_defense", null: false
    t.integer "initial_hp", null: false
    t.integer "initial_speed", null: false
    t.string "subject", null: false
    t.datetime "updated_at", null: false
    t.index ["battle_player_id", "subject"], name: "index_battle_summons_on_battle_player_id_and_subject", unique: true
    t.index ["battle_player_id"], name: "index_battle_summons_on_battle_player_id"
  end

  create_table "battles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.string "status", default: "waiting", null: false
    t.integer "turn_count"
    t.datetime "updated_at", null: false
    t.bigint "winner_id"
    t.index ["created_by_id"], name: "index_battles_on_created_by_id"
    t.index ["status"], name: "index_battles_on_status"
    t.index ["winner_id"], name: "index_battles_on_winner_id"
  end

  create_table "class_memberships", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "leader", default: false, null: false
    t.bigint "school_class_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["school_class_id", "leader"], name: "index_class_memberships_on_school_class_id_unique_leader", unique: true, where: "(leader = true)"
    t.index ["school_class_id"], name: "index_class_memberships_on_school_class_id"
    t.index ["user_id"], name: "index_class_memberships_on_user_id", unique: true
  end

  create_table "exam_questions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "exam_id", null: false
    t.text "model_answer", null: false
    t.integer "number", null: false
    t.integer "points", null: false
    t.text "question_text", null: false
    t.datetime "updated_at", null: false
    t.index ["exam_id", "number"], name: "index_exam_questions_on_exam_id_and_number", unique: true
    t.index ["exam_id"], name: "index_exam_questions_on_exam_id"
  end

  create_table "exams", force: :cascade do |t|
    t.text "answer_key_text"
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.integer "max_score", default: 100, null: false
    t.bigint "school_class_id", null: false
    t.string "subject", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_exams_on_created_by_id"
    t.index ["school_class_id"], name: "index_exams_on_school_class_id"
    t.index ["subject"], name: "index_exams_on_subject"
  end

  create_table "school_classes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "grade", default: 2, null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["grade", "name"], name: "index_school_classes_on_grade_and_name", unique: true
  end

  create_table "scores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "exam_id", null: false
    t.integer "score", null: false
    t.bigint "student_id", null: false
    t.datetime "updated_at", null: false
    t.index ["exam_id", "student_id"], name: "index_scores_on_exam_id_and_student_id", unique: true
    t.index ["exam_id"], name: "index_scores_on_exam_id"
    t.index ["student_id"], name: "index_scores_on_student_id"
  end

  create_table "summon_statuses", force: :cascade do |t|
    t.integer "attack", null: false
    t.datetime "created_at", null: false
    t.integer "defense", null: false
    t.integer "hp", null: false
    t.integer "speed", null: false
    t.bigint "student_id", null: false
    t.string "subject", null: false
    t.datetime "updated_at", null: false
    t.index ["student_id", "subject"], name: "index_summon_statuses_on_student_id_and_subject", unique: true
    t.index ["student_id"], name: "index_summon_statuses_on_student_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.string "role", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["role"], name: "index_users_on_role"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "answer_sheets", "exams"
  add_foreign_key "answer_sheets", "users", column: "student_id"
  add_foreign_key "battle_fields", "battles"
  add_foreign_key "battle_logs", "battles"
  add_foreign_key "battle_logs", "users", column: "actor_id"
  add_foreign_key "battle_logs", "users", column: "target_id"
  add_foreign_key "battle_players", "battles"
  add_foreign_key "battle_players", "users", column: "student_id"
  add_foreign_key "battle_summons", "battle_players"
  add_foreign_key "battles", "users", column: "created_by_id"
  add_foreign_key "battles", "users", column: "winner_id"
  add_foreign_key "class_memberships", "school_classes"
  add_foreign_key "class_memberships", "users"
  add_foreign_key "exam_questions", "exams"
  add_foreign_key "exams", "school_classes"
  add_foreign_key "exams", "users", column: "created_by_id"
  add_foreign_key "scores", "exams"
  add_foreign_key "scores", "users", column: "student_id"
  add_foreign_key "summon_statuses", "users", column: "student_id"
end
