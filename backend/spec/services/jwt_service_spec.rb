require 'rails_helper'

RSpec.describe JwtService do
  describe '.encode / .decode' do
    it 'ペイロードをエンコードしてデコードできる' do
      token = JwtService.encode({ user_id: 1 })
      decoded = JwtService.decode(token)

      expect(decoded['user_id']).to eq(1)
    end

    it 'エンコードしたトークンにexpが含まれ、現在時刻より未来である' do
      token = JwtService.encode({ user_id: 1 })
      decoded = JwtService.decode(token)

      expect(decoded['exp']).to be_present
      expect(decoded['exp']).to be > Time.now.to_i
    end

    it '有効期限は24時間後に設定される' do
      freeze_time do
        token = JwtService.encode({ user_id: 1 })
        decoded = JwtService.decode(token)

        expect(decoded['exp']).to be_within(1).of(24.hours.from_now.to_i)
      end
    end

    it '複数のペイロードフィールドを保持できる' do
      token = JwtService.encode({ user_id: 42, role: 'teacher' })
      decoded = JwtService.decode(token)

      expect(decoded['user_id']).to eq(42)
      expect(decoded['role']).to eq('teacher')
    end
  end

  describe '.decode' do
    it '期限切れトークンはnilを返す' do
      expired_token = JWT.encode(
        { user_id: 1, exp: 1.hour.ago.to_i },
        JwtService::SECRET_KEY,
        'HS256'
      )
      expect(JwtService.decode(expired_token)).to be_nil
    end

    it '改ざんされたトークンはnilを返す' do
      token = JwtService.encode({ user_id: 1 })
      expect(JwtService.decode(token + 'tampered')).to be_nil
    end

    it '異なる秘密鍵で署名されたトークンはnilを返す' do
      fake_token = JWT.encode({ user_id: 1, exp: 1.hour.from_now.to_i }, 'wrong_secret', 'HS256')
      expect(JwtService.decode(fake_token)).to be_nil
    end

    it '空文字トークンはnilを返す' do
      expect(JwtService.decode('')).to be_nil
    end

    it 'nilトークンはnilを返す' do
      expect(JwtService.decode(nil)).to be_nil
    end
  end
end
