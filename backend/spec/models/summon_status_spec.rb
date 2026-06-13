require 'rails_helper'

RSpec.describe SummonStatus, type: :model do
  let(:student) { users(:student_one) }

  it '有効なSummonStatusを作成できる' do
    ss = SummonStatus.new(student: student, subject: 'math', hp: 100, attack: 50, defense: 25, speed: 20)
    expect(ss).to be_valid
  end

  it '同じ生徒・同じ教科の重複登録は無効' do
    SummonStatus.create!(student: student, subject: 'math', hp: 100, attack: 50, defense: 25, speed: 20)
    dup = SummonStatus.new(student: student, subject: 'math', hp: 80, attack: 40, defense: 20, speed: 16)
    expect(dup).not_to be_valid
  end

  it '同じ生徒でも異なる教科なら有効' do
    SummonStatus.create!(student: student, subject: 'math',    hp: 100, attack: 50, defense: 25, speed: 20)
    ss = SummonStatus.new(student: student, subject: 'english', hp: 80,  attack: 40, defense: 20, speed: 16)
    expect(ss).to be_valid
  end

  it 'hp / attack / defense / speed が0は有効' do
    ss = SummonStatus.new(student: student, subject: 'math', hp: 0, attack: 0, defense: 0, speed: 0)
    expect(ss).to be_valid
  end

  it 'hp が負の値は無効' do
    ss = SummonStatus.new(student: student, subject: 'math', hp: -1, attack: 1, defense: 1, speed: 1)
    expect(ss).not_to be_valid
  end

  it 'subjectが空では無効' do
    ss = SummonStatus.new(student: student, subject: '', hp: 100, attack: 50, defense: 25, speed: 20)
    expect(ss).not_to be_valid
  end
end
