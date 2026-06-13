require 'rails_helper'

RSpec.describe UserSerializer do
  let(:user) { create(:user) }
  subject(:json) { UserSerializer.new(user).as_json }

  it '必要なフィールドをJSON形式で返す' do
    expect(json[:id]).to eq(user.id)
    expect(json[:name]).to eq(user.name)
    expect(json[:email]).to eq(user.email)
    expect(json[:role]).to eq(user.role)
    expect(json[:created_at]).to be_present
  end

  it 'created_atはISO8601形式の文字列を返す' do
    expect(json[:created_at]).to match(/\A\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  end

  it 'password_digestを含まない' do
    expect(json[:password_digest]).to be_nil
  end
end
