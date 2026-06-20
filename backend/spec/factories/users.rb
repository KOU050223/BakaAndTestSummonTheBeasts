FactoryBot.define do
  factory :user do
    name { Faker::Name.name }
    sequence(:email) { |n| "user#{n}@example.com" }
    password { "password123" }
    role { "student" }

    trait :student do
      role { "student" }
    end

    trait :teacher do
      role { "teacher" }
    end

    trait :school_admin do
      role { "school_admin" }
    end
  end
end
