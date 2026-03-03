export interface TarotCard {
  id: number;
  name_en: string;
  image_url: string;
  fallback_url: string;
  upright_desc_short: string;
  reversed_desc_short: string;
}

const WIKIMEDIA_BASE = "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file";
const SACRED_BASE = "https://www.sacred-texts.com/tarot/pkt/img";

const getSacredUrl = (id: number): string => {
  if (id <= 21) return `${SACRED_BASE}/ar${id.toString().padStart(2, '0')}.jpg`;
  
  const suits = ['wa', 'cu', 'sw', 'pe'];
  const suitIdx = Math.floor((id - 22) / 14);
  const cardIdx = (id - 22) % 14 + 1;
  const suit = suits[suitIdx];
  
  if (cardIdx <= 10) return `${SACRED_BASE}/${suit}${cardIdx.toString().padStart(2, '0')}.jpg`;
  if (cardIdx === 11) return `${SACRED_BASE}/${suit}pa.jpg`;
  if (cardIdx === 12) return `${SACRED_BASE}/${suit}kn.jpg`;
  if (cardIdx === 13) return `${SACRED_BASE}/${suit}qu.jpg`;
  return `${SACRED_BASE}/${suit}ki.jpg`;
};

export const TAROT_CARDS_DATA: TarotCard[] = [
  // MAJOR ARCANA
  { id: 0, name_en: "The Fool", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_00_Fool.jpg&width=500`, fallback_url: getSacredUrl(0), upright_desc_short: "Khởi đầu mới, tự do, ngây thơ.", reversed_desc_short: "Liều lĩnh, cẩu thả, thiếu chuẩn bị." },
  { id: 1, name_en: "The Magician", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_01_Magician.jpg&width=500`, fallback_url: getSacredUrl(1), upright_desc_short: "Sáng tạo, tháo vát, sức mạnh ý chí.", reversed_desc_short: "Thao túng, tài năng chưa khai thác." },
  { id: 2, name_en: "The High Priestess", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_02_High_Priestess.jpg&width=500`, fallback_url: getSacredUrl(2), upright_desc_short: "Trực giác, tiềm thức, bí ẩn.", reversed_desc_short: "Bí mật, ngắt kết nối trực giác." },
  { id: 3, name_en: "The Empress", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_03_Empress.jpg&width=500`, fallback_url: getSacredUrl(3), upright_desc_short: "Nữ tính, vẻ đẹp, sự dồi dào.", reversed_desc_short: "Sáng tạo bị tắc nghẽn, phụ thuộc." },
  { id: 4, name_en: "The Emperor", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_04_Emperor.jpg&width=500`, fallback_url: getSacredUrl(4), upright_desc_short: "Thẩm quyền, cấu trúc, kiểm soát.", reversed_desc_short: "Thống trị, cứng nhắc, thiếu kỷ luật." },
  { id: 5, name_en: "The Hierophant", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_05_Hierophant.jpg&width=500`, fallback_url: getSacredUrl(5), upright_desc_short: "Truyền thống, niềm tin, sự tuân thủ.", reversed_desc_short: "Nổi loạn, niềm tin cá nhân." },
  { id: 6, name_en: "The Lovers", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_06_Lovers.jpg&width=500`, fallback_url: getSacredUrl(6), upright_desc_short: "Tình yêu, hòa hợp, lựa chọn.", reversed_desc_short: "Mất cân bằng, thiếu hòa hợp." },
  { id: 7, name_en: "The Chariot", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_07_Chariot.jpg&width=500`, fallback_url: getSacredUrl(7), upright_desc_short: "Kiểm soát, ý chí, thành công.", reversed_desc_short: "Thiếu hướng đi, hung hăng." },
  { id: 8, name_en: "Strength", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_08_Strength.jpg&width=500`, fallback_url: getSacredUrl(8), upright_desc_short: "Sức mạnh, can đảm, trắc ẩn.", reversed_desc_short: "Tự ti, yếu đuối, thiếu tự chủ." },
  { id: 9, name_en: "The Hermit", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_09_Hermit.jpg&width=500`, fallback_url: getSacredUrl(9), upright_desc_short: "Nội tâm, cô độc, tìm kiếm sự thật.", reversed_desc_short: "Cô lập, cô đơn, rút lui quá mức." },
  { id: 10, name_en: "Wheel of Fortune", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_10_Wheel_of_Fortune.jpg&width=500`, fallback_url: getSacredUrl(10), upright_desc_short: "May mắn, nghiệp quả, chu kỳ.", reversed_desc_short: "Vận đen, kháng cự thay đổi." },
  { id: 11, name_en: "Justice", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_11_Justice.jpg&width=500`, fallback_url: getSacredUrl(11), upright_desc_short: "Công lý, sự thật, nhân quả.", reversed_desc_short: "Bất công, thiếu trách nhiệm." },
  { id: 12, name_en: "The Hanged Man", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_12_Hanged_Man.jpg&width=500`, fallback_url: getSacredUrl(12), upright_desc_short: "Tạm dừng, buông bỏ, góc nhìn mới.", reversed_desc_short: "Trì trệ, kháng cự, do dự." },
  { id: 13, name_en: "Death", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_13_Death.jpg&width=500`, fallback_url: getSacredUrl(13), upright_desc_short: "Kết thúc, thay đổi, chuyển tiếp.", reversed_desc_short: "Kháng cự thay đổi, trì hoãn." },
  { id: 14, name_en: "Temperance", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_14_Temperance.jpg&width=500`, fallback_url: getSacredUrl(14), upright_desc_short: "Cân bằng, điều độ, kiên nhẫn.", reversed_desc_short: "Mất cân bằng, dư thừa." },
  { id: 15, name_en: "The Devil", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_15_Devil.jpg&width=500`, fallback_url: getSacredUrl(15), upright_desc_short: "Ràng buộc, nghiện ngập, vật chất.", reversed_desc_short: "Giải thoát, tự do, kiểm soát." },
  { id: 16, name_en: "The Tower", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_16_Tower.jpg&width=500`, fallback_url: getSacredUrl(16), upright_desc_short: "Thay đổi đột ngột, hỗn loạn.", reversed_desc_short: "Tránh được thảm họa, sợ thay đổi." },
  { id: 17, name_en: "The Star", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_17_Star.jpg&width=500`, fallback_url: getSacredUrl(17), upright_desc_short: "Hy vọng, niềm tin, cảm hứng.", reversed_desc_short: "Mất niềm tin, tuyệt vọng." },
  { id: 18, name_en: "The Moon", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_18_Moon.jpg&width=500`, fallback_url: getSacredUrl(18), upright_desc_short: "Ảo tưởng, sợ hãi, trực giác.", reversed_desc_short: "Giải phóng nỗi sợ, nhầm lẫn." },
  { id: 19, name_en: "The Sun", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_19_Sun.jpg&width=500`, fallback_url: getSacredUrl(19), upright_desc_short: "Tích cực, vui vẻ, thành công.", reversed_desc_short: "U ám tạm thời, thiếu nhiệt huyết." },
  { id: 20, name_en: "Judgement", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_20_Judgement.jpg&width=500`, fallback_url: getSacredUrl(20), upright_desc_short: "Phán xét, tái sinh, thức tỉnh.", reversed_desc_short: "Nghi ngờ bản thân, thiếu tự nhận thức." },
  { id: 21, name_en: "The World", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_21_World.jpg&width=500`, fallback_url: getSacredUrl(21), upright_desc_short: "Hoàn thành, thành tựu, du lịch.", reversed_desc_short: "Thiếu sự hoàn thiện, trì hoãn." },

  // MINOR ARCANA - WANDS
  { id: 22, name_en: "Ace of Wands", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Ace_of_Wands.jpg&width=500`, fallback_url: getSacredUrl(22), upright_desc_short: "Sáng tạo, nhiệt huyết, khởi đầu.", reversed_desc_short: "Thiếu động lực, trì hoãn." },
  { id: 23, name_en: "Two of Wands", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_02_Wands.jpg&width=500`, fallback_url: getSacredUrl(23), upright_desc_short: "Lập kế hoạch, quyết định, khám phá.", reversed_desc_short: "Thiếu tầm nhìn, sợ hãi." },
  { id: 24, name_en: "Three of Wands", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_03_Wands.jpg&width=500`, fallback_url: getSacredUrl(24), upright_desc_short: "Mở rộng, tầm nhìn, tiến bộ.", reversed_desc_short: "Trì hoãn, thiếu hợp tác." },
  { id: 25, name_en: "Four of Wands", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_04_Wands.jpg&width=500`, fallback_url: getSacredUrl(25), upright_desc_short: "Ăn mừng, hòa hợp, gia đình.", reversed_desc_short: "Thiếu ổn định, xung đột." },
  { id: 26, name_en: "Five of Wands", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_05_Wands.jpg&width=500`, fallback_url: getSacredUrl(26), upright_desc_short: "Cạnh tranh, xung đột, bất đồng.", reversed_desc_short: "Tránh né xung đột, hòa giải." },
  { id: 27, name_en: "Six of Wands", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_06_Wands.jpg&width=500`, fallback_url: getSacredUrl(27), upright_desc_short: "Chiến thắng, công nhận, tự tin.", reversed_desc_short: "Thất bại, thiếu tự tin." },
  { id: 28, name_en: "Seven of Wands", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_07_Wands.jpg&width=500`, fallback_url: getSacredUrl(28), upright_desc_short: "Kiên trì, phòng thủ, bảo vệ.", reversed_desc_short: "Bị áp đảo, bỏ cuộc." },
  { id: 29, name_en: "Eight of Wands", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_08_Wands.jpg&width=500`, fallback_url: getSacredUrl(29), upright_desc_short: "Tốc độ, hành động, tin tức.", reversed_desc_short: "Trì trệ, hỗn loạn." },
  { id: 30, name_en: "Nine of Wands", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_09_Wands.jpg&width=500`, fallback_url: getSacredUrl(30), upright_desc_short: "Sức bền, kiên cường, cảnh giác.", reversed_desc_short: "Kiệt sức, phòng thủ quá mức." },
  { id: 31, name_en: "Ten of Wands", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_10_Wands.jpg&width=500`, fallback_url: getSacredUrl(31), upright_desc_short: "Gánh nặng, trách nhiệm, vất vả.", reversed_desc_short: "Buông bỏ, kiệt sức." },
  { id: 32, name_en: "Page of Wands", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Page_of_Wands.jpg&width=500`, fallback_url: getSacredUrl(32), upright_desc_short: "Khám phá, nhiệt huyết, tin tức.", reversed_desc_short: "Thiếu định hướng, do dự." },
  { id: 33, name_en: "Knight of Wands", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Knight_of_Wands.jpg&width=500`, fallback_url: getSacredUrl(33), upright_desc_short: "Hành động, phiêu lưu, bốc đồng.", reversed_desc_short: "Hung hăng, thiếu kiên nhẫn." },
  { id: 34, name_en: "Queen of Wands", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Queen_of_Wands.jpg&width=500`, fallback_url: getSacredUrl(34), upright_desc_short: "Tự tin, quyết đoán, quyến rũ.", reversed_desc_short: "Ghen tuông, ích kỷ." },
  { id: 35, name_en: "King of Wands", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_King_of_Wands.jpg&width=500`, fallback_url: getSacredUrl(35), upright_desc_short: "Lãnh đạo, tầm nhìn, doanh nhân.", reversed_desc_short: "Độc đoán, nóng nảy." },

  // MINOR ARCANA - CUPS
  { id: 36, name_en: "Ace of Cups", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Ace_of_Cups.jpg&width=500`, fallback_url: getSacredUrl(36), upright_desc_short: "Tình yêu mới, cảm xúc dâng trào.", reversed_desc_short: "Cảm xúc bị kìm nén, cô đơn." },
  { id: 37, name_en: "Two of Cups", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_02_Cups.jpg&width=500`, fallback_url: getSacredUrl(37), upright_desc_short: "Kết nối, đối tác, tình yêu.", reversed_desc_short: "Rạn nứt, thiếu hòa hợp." },
  { id: 38, name_en: "Three of Cups", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_03_Cups.jpg&width=500`, fallback_url: getSacredUrl(38), upright_desc_short: "Ăn mừng, tình bạn, cộng đồng.", reversed_desc_short: "Cô lập, tiệc tùng quá đà." },
  { id: 39, name_en: "Four of Cups", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_04_Cups.jpg&width=500`, fallback_url: getSacredUrl(39), upright_desc_short: "Suy ngẫm, thờ ơ, bỏ lỡ.", reversed_desc_short: "Thức tỉnh, cơ hội mới." },
  { id: 40, name_en: "Five of Cups", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_05_Cups.jpg&width=500`, fallback_url: getSacredUrl(40), upright_desc_short: "Hối tiếc, mất mát, nỗi buồn.", reversed_desc_short: "Chấp nhận, vượt qua nỗi đau." },
  { id: 41, name_en: "Six of Cups", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_06_Cups.jpg&width=500`, fallback_url: getSacredUrl(41), upright_desc_short: "Kỷ niệm, hoài niệm, trẻ thơ.", reversed_desc_short: "Mắc kẹt trong quá khứ." },
  { id: 42, name_en: "Seven of Cups", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_07_Cups.jpg&width=500`, fallback_url: getSacredUrl(42), upright_desc_short: "Lựa chọn, ảo tưởng, mơ mộng.", reversed_desc_short: "Sự rõ ràng, quyết định." },
  { id: 43, name_en: "Eight of Cups", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_08_Cups.jpg&width=500`, fallback_url: getSacredUrl(43), upright_desc_short: "Rời bỏ, tìm kiếm ý nghĩa.", reversed_desc_short: "Sợ hãi thay đổi, mắc kẹt." },
  { id: 44, name_en: "Nine of Cups", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_09_Cups.jpg&width=500`, fallback_url: getSacredUrl(44), upright_desc_short: "Hài lòng, ước nguyện thành sự thật.", reversed_desc_short: "Tham lam, không thỏa mãn." },
  { id: 45, name_en: "Ten of Cups", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_10_Cups.jpg&width=500`, fallback_url: getSacredUrl(45), upright_desc_short: "Hạnh phúc gia đình, viên mãn.", reversed_desc_short: "Xung đột gia đình, mất kết nối." },
  { id: 46, name_en: "Page of Cups", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Page_of_Cups.jpg&width=500`, fallback_url: getSacredUrl(46), upright_desc_short: "Sáng tạo, tin tức cảm xúc.", reversed_desc_short: "Thiếu chín chắn, ảo tưởng." },
  { id: 47, name_en: "Knight of Cups", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Knight_of_Cups.jpg&width=500`, fallback_url: getSacredUrl(47), upright_desc_short: "Lãng mạn, quyến rũ, lý tưởng.", reversed_desc_short: "Thay đổi tâm trạng, không thực tế." },
  { id: 48, name_en: "Queen of Cups", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Queen_of_Cups.jpg&width=500`, fallback_url: getSacredUrl(48), upright_desc_short: "Trắc ẩn, trực giác, nuôi dưỡng.", reversed_desc_short: "Phụ thuộc cảm xúc, bất an." },
  { id: 49, name_en: "King of Cups", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_King_of_Cups.jpg&width=500`, fallback_url: getSacredUrl(49), upright_desc_short: "Cân bằng cảm xúc, điềm tĩnh.", reversed_desc_short: "Thao túng cảm xúc, lạnh lùng." },

  // MINOR ARCANA - SWORDS
  { id: 50, name_en: "Ace of Swords", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Ace_of_Swords.jpg&width=500`, fallback_url: getSacredUrl(50), upright_desc_short: "Sáng suốt, đột phá, sự thật.", reversed_desc_short: "Nhầm lẫn, hỗn loạn." },
  { id: 51, name_en: "Two of Swords", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_02_Swords.jpg&width=500`, fallback_url: getSacredUrl(51), upright_desc_short: "Bế tắc, do dự, lựa chọn khó.", reversed_desc_short: "Sự rõ ràng, quyết định." },
  { id: 52, name_en: "Three of Swords", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_03_Swords.jpg&width=500`, fallback_url: getSacredUrl(52), upright_desc_short: "Đau lòng, nỗi buồn, chia ly.", reversed_desc_short: "Hồi phục, tha thứ." },
  { id: 53, name_en: "Four of Swords", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_04_Swords.jpg&width=500`, fallback_url: getSacredUrl(53), upright_desc_short: "Nghỉ ngơi, hồi phục, chiêm nghiệm.", reversed_desc_short: "Kiệt sức, bồn chồn." },
  { id: 54, name_en: "Five of Swords", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_05_Swords.jpg&width=500`, fallback_url: getSacredUrl(54), upright_desc_short: "Xung đột, thất bại, ích kỷ.", reversed_desc_short: "Hòa giải, buông bỏ hận thù." },
  { id: 55, name_en: "Six of Swords", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_06_Swords.jpg&width=500`, fallback_url: getSacredUrl(55), upright_desc_short: "Chuyển tiếp, rời bỏ khó khăn.", reversed_desc_short: "Mắc kẹt, kháng cự thay đổi." },
  { id: 56, name_en: "Seven of Swords", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_07_Swords.jpg&width=500`, fallback_url: getSacredUrl(56), upright_desc_short: "Lừa dối, chiến thuật, bí mật.", reversed_desc_short: "Sự thật phơi bày, thú nhận." },
  { id: 57, name_en: "Eight of Swords", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_08_Swords.jpg&width=500`, fallback_url: getSacredUrl(57), upright_desc_short: "Bị giam cầm, bất lực, sợ hãi.", reversed_desc_short: "Tự do, sức mạnh mới." },
  { id: 58, name_en: "Nine of Swords", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_09_Swords.jpg&width=500`, fallback_url: getSacredUrl(58), upright_desc_short: "Lo lắng, ác mộng, tuyệt vọng.", reversed_desc_short: "Hy vọng, giải tỏa nỗi lo." },
  { id: 59, name_en: "Ten of Swords", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_10_Swords.jpg&width=500`, fallback_url: getSacredUrl(59), upright_desc_short: "Kết thúc đau đớn, thất bại.", reversed_desc_short: "Hồi sinh, khởi đầu mới." },
  { id: 60, name_en: "Page of Swords", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Page_of_Swords.jpg&width=500`, fallback_url: getSacredUrl(60), upright_desc_short: "Tò mò, cảnh giác, tin tức.", reversed_desc_short: "Nói suông, thiếu hành động." },
  { id: 61, name_en: "Knight of Swords", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Knight_of_Swords.jpg&width=500`, fallback_url: getSacredUrl(61), upright_desc_short: "Quyết đoán, hành động nhanh.", reversed_desc_short: "Hung hăng, thiếu suy nghĩ." },
  { id: 62, name_en: "Queen of Swords", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Queen_of_Swords.jpg&width=500`, fallback_url: getSacredUrl(62), upright_desc_short: "Sắc sảo, độc lập, trung thực.", reversed_desc_short: "Lạnh lùng, tàn nhẫn." },
  { id: 63, name_en: "King of Swords", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_King_of_Swords.jpg&width=500`, fallback_url: getSacredUrl(63), upright_desc_short: "Trí tuệ, thẩm quyền, sự thật.", reversed_desc_short: "Lạm dụng quyền lực, tàn nhẫn." },

  // MINOR ARCANA - PENTACLES
  { id: 64, name_en: "Ace of Pentacles", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Ace_of_Pentacles.jpg&width=500`, fallback_url: getSacredUrl(64), upright_desc_short: "Cơ hội mới, thịnh vượng.", reversed_desc_short: "Bỏ lỡ cơ hội, thiếu thực tế." },
  { id: 65, name_en: "Two of Pentacles", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_02_Pentacles.jpg&width=500`, fallback_url: getSacredUrl(65), upright_desc_short: "Cân bằng, thích nghi, quản lý.", reversed_desc_short: "Mất cân bằng, quá tải." },
  { id: 66, name_en: "Three of Pentacles", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_03_Pentacles.jpg&width=500`, fallback_url: getSacredUrl(66), upright_desc_short: "Hợp tác, kỹ năng, học hỏi.", reversed_desc_short: "Thiếu nỗ lực, bất đồng." },
  { id: 67, name_en: "Four of Pentacles", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_04_Pentacles.jpg&width=500`, fallback_url: getSacredUrl(67), upright_desc_short: "Tiết kiệm, an toàn, kiểm soát.", reversed_desc_short: "Tham lam, cứng nhắc." },
  { id: 68, name_en: "Five of Pentacles", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_05_Pentacles.jpg&width=500`, fallback_url: getSacredUrl(68), upright_desc_short: "Khó khăn tài chính, cô đơn.", reversed_desc_short: "Hồi phục tài chính, hy vọng." },
  { id: 69, name_en: "Six of Pentacles", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_06_Pentacles.jpg&width=500`, fallback_url: getSacredUrl(69), upright_desc_short: "Hào phóng, từ thiện, chia sẻ.", reversed_desc_short: "Nợ nần, ích kỷ." },
  { id: 70, name_en: "Seven of Pentacles", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_07_Pentacles.jpg&width=500`, fallback_url: getSacredUrl(70), upright_desc_short: "Kiên nhẫn, đầu tư, thu hoạch.", reversed_desc_short: "Thiếu tiến bộ, thất vọng." },
  { id: 71, name_en: "Eight of Pentacles", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_08_Pentacles.jpg&width=500`, fallback_url: getSacredUrl(71), upright_desc_short: "Chăm chỉ, kỹ năng, tỉ mỉ.", reversed_desc_short: "Thiếu tập trung, cẩu thả." },
  { id: 72, name_en: "Nine of Pentacles", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_09_Pentacles.jpg&width=500`, fallback_url: getSacredUrl(72), upright_desc_short: "Độc lập, sang trọng, tự do.", reversed_desc_short: "Phụ thuộc, chi tiêu quá đà." },
  { id: 73, name_en: "Ten of Pentacles", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_10_Pentacles.jpg&width=500`, fallback_url: getSacredUrl(73), upright_desc_short: "Di sản, gia đình, giàu có.", reversed_desc_short: "Mất mát tài sản, xung đột." },
  { id: 74, name_en: "Page of Pentacles", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Page_of_Pentacles.jpg&width=500`, fallback_url: getSacredUrl(74), upright_desc_short: "Tham vọng, học hỏi, cơ hội.", reversed_desc_short: "Thiếu mục tiêu, trì hoãn." },
  { id: 75, name_en: "Knight of Pentacles", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Knight_of_Pentacles.jpg&width=500`, fallback_url: getSacredUrl(75), upright_desc_short: "Chăm chỉ, thực tế, kiên định.", reversed_desc_short: "Lười biếng, bảo thủ." },
  { id: 76, name_en: "Queen of Pentacles", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_Queen_of_Pentacles.jpg&width=500`, fallback_url: getSacredUrl(76), upright_desc_short: "Thực tế, nuôi dưỡng, dồi dào.", reversed_desc_short: "Bất an, ích kỷ." },
  { id: 77, name_en: "King of Pentacles", image_url: `${WIKIMEDIA_BASE}/RWS_Tarot_King_of_Pentacles.jpg&width=500`, fallback_url: getSacredUrl(77), upright_desc_short: "Thành công tài chính, ổn định.", reversed_desc_short: "Tham lam, độc đoán." }
];
