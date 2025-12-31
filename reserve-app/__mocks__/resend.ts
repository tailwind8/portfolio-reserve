export const mockSend = jest.fn();

export class Resend {
  emails = {
    send: mockSend,
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_apiKey?: string) {
    // モックコンストラクタ
  }
}
