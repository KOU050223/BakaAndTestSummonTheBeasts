FactoryBot.define do
  factory :battle do
    association :created_by, factory: :user, strategy: :create, role: "teacher"
    status { "waiting" }
  end

  factory :battle_player do
    association :battle
    association :student, factory: :user

    factory :battle_player_with_summons do
      transient do
        subjects { %w[math english physics] }
      end

      after(:create) do |player, evaluator|
        evaluator.subjects.each do |subject|
          create(:battle_summon, battle_player: player, subject: subject)
        end
      end
    end
  end

  factory :battle_field do
    association :battle
    subject { "math" }
    center_x { 0.0 }
    center_z { 0.0 }
    radius { 3.0 }
  end

  factory :battle_summon do
    association :battle_player
    subject { "math" }
    initial_hp { 142 }
    initial_attack { 33 }
    initial_defense { 12 }
    initial_speed { 8 }
  end
end
