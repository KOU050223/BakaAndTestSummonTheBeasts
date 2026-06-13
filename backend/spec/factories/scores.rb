FactoryBot.define do
  factory :score do
    score { 80 }
    association :exam
    association :student, factory: :user
  end
end
