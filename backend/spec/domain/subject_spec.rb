require 'rails_helper'

RSpec.describe Subject do
  describe '.label' do
    it '既知の科目コードを日本語ラベルに変換する' do
      expect(Subject.label('math')).to eq('数学')
      expect(Subject.label('english')).to eq('英語')
    end

    it '未知のコードはコードそのものを返す（フォールバック）' do
      expect(Subject.label('unknown')).to eq('unknown')
    end
  end

  describe 'CODES / LABELS' do
    it 'CODES と LABELS のキーは ALL と一致する' do
      codes = Subject::ALL.map { |s| s[:code] }
      expect(Subject::CODES).to eq(codes)
      expect(Subject::LABELS.keys).to eq(codes)
    end

    it 'Exam::SUBJECTS は Subject::CODES を出典とする' do
      expect(Exam::SUBJECTS).to equal(Subject::CODES)
    end
  end
end
