# find_or_create_by! でべき等に実行できる

# -----------------------------------------------
# クラス
# -----------------------------------------------
class_a = SchoolClass.find_or_create_by!(name: "Aクラス")
class_f = SchoolClass.find_or_create_by!(name: "Fクラス")

# -----------------------------------------------
# 教師
# -----------------------------------------------
teacher = User.find_or_create_by!(email: "teacher@example.com") do |u|
  u.name     = "文月学"
  u.password = "password"
  u.role     = "teacher"
end

# -----------------------------------------------
# 生徒（Aクラス）
# -----------------------------------------------
student_a1 = User.find_or_create_by!(email: "himeji@example.com") do |u|
  u.name     = "姫路瑞希"
  u.password = "password"
  u.role     = "student"
end

student_a2 = User.find_or_create_by!(email: "kirishima@example.com") do |u|
  u.name     = "霧島翔子"
  u.password = "password"
  u.role     = "student"
end

# -----------------------------------------------
# 生徒（Fクラス）
# -----------------------------------------------
student_f1 = User.find_or_create_by!(email: "yoshii@example.com") do |u|
  u.name     = "吉井明久"
  u.password = "password"
  u.role     = "student"
end

student_f2 = User.find_or_create_by!(email: "tsuchiya@example.com") do |u|
  u.name     = "土屋康太"
  u.password = "password"
  u.role     = "student"
end

# -----------------------------------------------
# クラス所属
# -----------------------------------------------
ClassMembership.find_or_create_by!(user: student_a1) { |m| m.school_class = class_a }
ClassMembership.find_or_create_by!(user: student_a2) { |m| m.school_class = class_a }
ClassMembership.find_or_create_by!(user: student_f1) { |m| m.school_class = class_f }
ClassMembership.find_or_create_by!(user: student_f2) { |m| m.school_class = class_f }

# -----------------------------------------------
# 試験
# -----------------------------------------------
exam_math = Exam.find_or_create_by!(title: "数学 小テスト1", subject: "math", school_class: class_f) do |e|
  e.created_by = teacher
  e.max_score  = 100
end

exam_english = Exam.find_or_create_by!(title: "英語 小テスト1", subject: "english", school_class: class_f) do |e|
  e.created_by = teacher
  e.max_score  = 100
end

# -----------------------------------------------
# 点数（Fクラス生徒の数学・英語）
# -----------------------------------------------
Score.find_or_create_by!(exam: exam_math, student: student_f1) { |s| s.score = 42 }
Score.find_or_create_by!(exam: exam_math, student: student_f2) { |s| s.score = 55 }
Score.find_or_create_by!(exam: exam_english, student: student_f1) { |s| s.score = 38 }
Score.find_or_create_by!(exam: exam_english, student: student_f2) { |s| s.score = 61 }

# -----------------------------------------------
# 召喚獣ステータス（点数から一次式で計算）
# HP = 点数 * 2, 攻撃 = 点数 / 2, 防御 = 点数 / 4, 素早さ = 点数 / 5
# -----------------------------------------------
[
  { student: student_f1, subject: "math",    score: 42 },
  { student: student_f1, subject: "english", score: 38 },
  { student: student_f2, subject: "math",    score: 55 },
  { student: student_f2, subject: "english", score: 61 },
].each do |entry|
  SummonStatus.find_or_create_by!(student: entry[:student], subject: entry[:subject]) do |ss|
    ss.hp      = entry[:score] * 2
    ss.attack  = [entry[:score] / 2, 1].max
    ss.defense = [entry[:score] / 4, 1].max
    ss.speed   = [entry[:score] / 5, 1].max
  end
end

puts "Seed完了:"
puts "  クラス: #{SchoolClass.count}"
puts "  ユーザー: #{User.count} (教師: #{User.where(role: 'teacher').count}, 生徒: #{User.where(role: 'student').count})"
puts "  試験: #{Exam.count}"
puts "  点数: #{Score.count}"
puts "  召喚獣ステータス: #{SummonStatus.count}"
