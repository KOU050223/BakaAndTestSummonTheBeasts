require 'rails_helper'
require 'rake'

RSpec.describe 'db:seed:demo' do
  around do |example|
    original_values = ENV.values_at('DEMO_ADMIN_PASSWORD', 'DEMO_USER_PASSWORD')
    ENV['DEMO_ADMIN_PASSWORD'] = 'admin-password-123'
    ENV['DEMO_USER_PASSWORD'] = 'demo-password-123'
    example.run
  ensure
    ENV['DEMO_ADMIN_PASSWORD'], ENV['DEMO_USER_PASSWORD'] = original_values
  end

  before(:all) do
    Rails.application.load_tasks unless Rake::Task.task_defined?('db:seed:demo')
  end

  it 'デモデータ投入用の明示的なタスクとして利用できる' do
    expect(Rake::Task.task_defined?('db:seed:demo')).to be(true)
  end

  it '各ロールで操作を確認できる一式のデモデータを投入する' do
    task = Rake::Task['db:seed:demo']
    task.reenable
    task.invoke

    expect(User.group(:role).count).to eq(
      'school_admin' => 1,
      'teacher' => 2,
      'student' => 18
    )
    expect(SchoolClass.count).to eq(6)
    expect(ClassMembership.count).to eq(18)
    expect(Exam.count).to eq(12)
    expect(Score.count).to eq(36)
    expect(SummonStatus.count).to eq(36)
    expect(User.find_by!(email: 'admin@example.com').authenticate('admin-password-123')).to be_truthy
    expect(User.find_by!(email: 'kirishima@example.com').authenticate('demo-password-123')).to be_truthy
  end

  it '再実行してもデモデータを重複させない' do
    task = Rake::Task['db:seed:demo']
    2.times do
      task.reenable
      task.invoke
    end

    expect(User.count).to eq(21)
    expect(SchoolClass.count).to eq(6)
    expect(Exam.count).to eq(12)
    expect(Score.count).to eq(36)
  end

  it '開発環境用seedにはローカル確認用のパスワード既定値がある' do
    ENV.delete('DEMO_ADMIN_PASSWORD')
    ENV.delete('DEMO_USER_PASSWORD')

    expect { load Rails.root.join('db/seeds/development.rb') }.not_to raise_error
  end
end
