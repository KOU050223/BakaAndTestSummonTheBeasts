class CreateExams < ActiveRecord::Migration[8.1]
  def change
    create_table :exams do |t|
      t.string :title, null: false
      t.string :subject, null: false  # english / math / physics / chemistry / biology / earth_science / geography / japanese_history / world_history / civics / japanese
      t.references :school_class, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.integer :max_score, null: false, default: 100

      t.timestamps
    end

    add_index :exams, :subject
  end
end
