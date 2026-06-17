FactoryBot.define do
  factory :exam_question do
    association :exam
    sequence(:number) { |n| n }
    sequence(:question_text) { |n| "問題#{n}の文章" }
    sequence(:model_answer) { |n| "模範解答#{n}" }
    points { 10 }
  end
end
