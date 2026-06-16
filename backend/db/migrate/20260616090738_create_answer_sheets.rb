class CreateAnswerSheets < ActiveRecord::Migration[8.1]
  def change
    create_table :answer_sheets do |t|
      t.references :exam, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.string :status, null: false, default: "pending"
      t.text :ocr_text

      t.timestamps
    end

    add_index :answer_sheets, [ :exam_id, :student_id ], unique: true
    add_index :answer_sheets, :status
  end
end
