FactoryBot.define do
  factory :school_class do
    sequence(:name) { |n| "#{n}組" }
  end
end
