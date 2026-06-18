class CreateExamQuestions < ActiveRecord::Migration[8.1]
  def change
    create_table :exam_questions do |t|
      t.references :exam, null: false, foreign_key: true
      t.integer :number, null: false
      t.text :question_text, null: false
      t.text :model_answer, null: false
      t.integer :points, null: false

      t.timestamps
    end

    add_index :exam_questions, [ :exam_id, :number ], unique: true
  end
end
