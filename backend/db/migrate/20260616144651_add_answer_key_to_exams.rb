class AddAnswerKeyToExams < ActiveRecord::Migration[8.1]
  def change
    add_column :exams, :answer_key_text, :text
  end
end
