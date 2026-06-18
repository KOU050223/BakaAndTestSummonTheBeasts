FactoryBot.define do
  factory :answer_sheet do
    association :exam
    association :student, factory: :user, role: "student"
    status { "pending" }
    ocr_text { nil }
  end
end
