// chat-features.ts — Emojis & Quick Templates for Chat

export const POPULAR_EMOJIS = [
  '😊', '😂', '🤣', '❤️', '👍', '🙏', '🔥', '🎉', '😍', '🤔',
  '👏', '🙌', '✨', '😎', '😢', '😭', '😮', '😡', '👍', '👎',
  '💯', '✔️', '❌', '👀', '💡', '📌', '💼', '📝', '🤝', '🚀',
  '⭐', '💬', '📞', '📧', '📅', '📍', '💻', '☕', '💪', '✌️'
];

export interface IQuickTemplate {
  label: string;
  text: string;
}

export const CANDIDATE_TEMPLATES: IQuickTemplate[] = [
  {
    label: "👋 Chào hỏi",
    text: "Chào anh/chị, em xin phép gửi thông tin ứng tuyển và mong có cơ hội trao đổi chi tiết hơn về vị trí tuyển dụng ạ."
  },
  {
    label: "📎 Gửi CV",
    text: "Em xin phép gửi CV đính kèm bên dưới để anh/chị tham khảo. Rất mong nhận được phản hồi từ anh/chị ạ."
  },
  {
    label: "💖 Cảm ơn phỏng vấn",
    text: "Em cảm ơn anh/chị đã dành thời gian trao đổi và phỏng vấn em ngày hôm nay. Em rất hy vọng có cơ hội đồng hành cùng công ty."
  }
];

export const HR_TEMPLATES: IQuickTemplate[] = [
  {
    label: "📅 Hẹn phỏng vấn",
    text: "Chào bạn, chúng tôi rất ấn tượng với hồ sơ của bạn và muốn mời bạn tham gia buổi phỏng vấn online qua Teams/Meet vào lúc ... Bạn phản hồi giúp tôi nếu thời gian này phù hợp nhé."
  },
  {
    label: "🇬🇧 Yêu cầu English CV",
    text: "Chào bạn, để thuận tiện cho quá trình đánh giá chuyên môn, bạn vui lòng gửi thêm cho chúng tôi bản CV bằng tiếng Anh được không? Cảm ơn bạn!"
  },
  {
    label: "📬 Xác nhận ứng tuyển",
    text: "Chào bạn, cảm ơn bạn đã quan tâm đến cơ hội nghề nghiệp tại công ty. Chúng tôi đã nhận được hồ sơ của bạn và sẽ phản hồi kết quả sớm nhất sau khi đánh giá."
  }
];
