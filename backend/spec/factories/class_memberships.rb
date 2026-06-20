FactoryBot.define do
  factory :class_membership do
    association :user
    association :school_class
    leader { false }
  end
end
