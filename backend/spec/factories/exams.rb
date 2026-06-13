FactoryBot.define do
  factory :exam do
    sequence(:title) { |n| "テスト#{n}" }
    subject { "math" }
    max_score { 100 }
    association :school_class
    association :created_by, factory: :user, strategy: :create, role: "teacher"

    trait :english do
      subject { "english" }
    end

    trait :max_200 do
      max_score { 200 }
    end
  end
end
