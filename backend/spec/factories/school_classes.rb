FactoryBot.define do
  factory :school_class do
    grade { 2 }
    sequence(:name) { |n| "#{n}組" }
  end
end
