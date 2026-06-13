require 'rails_helper'

RSpec.describe SummonStatus, type: :model do
  let(:student) { create(:user) }

  it '有効なSummonStatusを作成できる' do
    ss = build(:summon_status, student: student)
    expect(ss).to be_valid
  end

  it '同じ生徒・同じ教科の重複登録は無効' do
    create(:summon_status, student: student, subject: 'math')
    expect(build(:summon_status, student: student, subject: 'math')).not_to be_valid
  end

  it '同じ生徒でも異なる教科なら有効' do
    create(:summon_status, student: student, subject: 'math')
    expect(build(:summon_status, student: student, subject: 'english')).to be_valid
  end

  it 'hp / attack / defense / speed が0は有効' do
    expect(build(:summon_status, student: student, hp: 0, attack: 0, defense: 0, speed: 0)).to be_valid
  end

  it 'hp が負の値は無効' do
    expect(build(:summon_status, student: student, hp: -1)).not_to be_valid
  end

  it 'subjectが空では無効' do
    expect(build(:summon_status, student: student, subject: '')).not_to be_valid
  end
end
