export class ReportEntity {
  constructor({ id = null, userId, title, msg, createdAt = null }) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.msg = msg;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
  }
  validate() {
    if (!this.userId) throw new Error("userId_required");
    if (!this.msg) throw new Error("msg_required");
    if (!this.title) throw new Error("title_required");
    return true;
  }
}