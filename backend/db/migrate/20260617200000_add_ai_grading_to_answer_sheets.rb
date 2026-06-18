class AddAiGradingToAnswerSheets < ActiveRecord::Migration[8.1]
  def change
    add_column :answer_sheets, :ai_grading, :jsonb
  end
end
