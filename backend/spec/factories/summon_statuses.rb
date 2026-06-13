FactoryBot.define do
  factory :summon_status do
    association :student, factory: :user
    subject { "math" }
    hp { 100 }
    attack { 50 }
    defense { 25 }
    speed { 20 }
  end
end
