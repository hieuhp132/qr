import { useState, useEffect } from 'react';

export default function App() {
  const [senderName, setSenderName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
    const [amount, setAmount] = useState('');
  const [payment, setPayment] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = 'https://api.alowork.com';

  // Fetch payments on component mount
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${API_BASE}/local/sepay/payments`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.payments);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!senderName || !bankAccount || !bankName) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/local/sepay/makeQrCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, senderName, bankAccount, bankName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || 'Lỗi khi tạo phiếu thanh toán');
      }

      const data = await response.json();
      console.log('Payment created:', data);
      const newPayment = data.payment;

      setPayment(newPayment);
      setQrUrl(data.qrUrl);
      setHistory([newPayment, ...history]);
      fetchPayments(); // Refresh to get latest status
      setSenderName('');
      setBankAccount('');
      setBankName('');
        setAmount('');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <header className="hero">
        <div>
          <span className="eyebrow">Hệ thống điều phối chuyển khoản ngân hàng bảo mật</span>
          <h1>Nền tảng thanh toán SePay với VA động, QR hết hạn và đối soát giao dịch.</h1>
          <p>
            Luồng thanh toán được thiết kế sẵn cho môi trường thực tế: Tài khoản ảo riêng theo từng đơn hàng tùy biến tên người nhận, đếm ngược 15/30 phút, webhook xác thực và lưu vết đầy đủ payload phục vụ đối soát.
          </p>
        </div>
      </header>

      <main className="main-grid">
        <section className="card form-card">
          <div className="card-title">Tạo phiếu thanh toán</div>
          <div className="card-subtitle">Phiên chuyển khoản SePay</div>

          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              <span>Tên người chuyển khoản</span>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Nhập tên người chuyển khoản"
                required
              />
            </label>

            <label>
              <span>Tài khoản ngân hàng</span>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Nhập số tài khoản"
                required
              />
            </label>

            <label>
              <span>Tên ngân hàng</span>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Nhập tên ngân hàng"
                required
              />
            </label>

            <label>
              <span>Số tiền cần chuyển</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Nhập số tiền cần chuyển (ví dụ: 100000)"
                required
              />
            </label>


            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo phiếu thanh toán'}
            </button>
          </form>
        </section>

        <section className="card summary-card">
          <div className="small-label">Phiên thanh toán</div>
          {!payment ? (
            <div className="summary-placeholder">Chưa có phiên nào được tạo.</div>
          ) : (
            <div className="summary-detail">
              <div>
                <strong>Tên người chuyển:</strong> <span>{payment.senderName}</span>
              </div>
              <div>
                <strong>Tài khoản ngân hàng:</strong> <span>{payment.bankAccount}</span>
              </div>
              <div>
                <strong>Tên ngân hàng:</strong> <span>{payment.bankName}</span>
              </div>
                <div>
                <strong>Số tiền:</strong> <span>{payment.amount.toLocaleString()} VND</span>
              </div>
              
              {qrUrl && (
                <div className="qr-code-section">
                  <strong>Mã QR:</strong>
                  {/* <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="qr-code-link"> */}
                    <img 
                      src={qrUrl} 
                      alt="QR Code" 
                      className="qr-code-img"
                    />
                  {/* </a> */}
                  <small className="qr-hint">Nhấn để xem QR code trực tuyến</small>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <section className="history-card card">
        <div className="history-header">
          <div>
            <p className="small-label">Đối soát</p>
            <h2>Thông tin người chuyển tiền đã nhận</h2>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Đơn hàng</th>
                <th>TK chuyển</th>
                <th>Tên người chuyển</th>
                <th>Nội dung chuyển khoản</th>
                <th>Tên ngân hàng</th>
                <th>Số tiền muốn chuyển</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-row">
                    Chưa có phiên nào được tạo.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.bankAccount}</td>
                    <td>{item.senderName}</td>
                    <td>{item.transferContent}</td>
                    <td>{item.bankName}</td>
                    <td>{item.amount.toLocaleString()} VND</td>
                    <td className={`status-${item.status === 'Đã thanh toán' ? 'paid' : 'pending'}`}>
                      {item.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
