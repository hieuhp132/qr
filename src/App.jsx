import { useState, useEffect } from 'react';
import { QRCode } from 'react-qr-code';

function TingeeQR({ qrCode, size = 256 }) {
  if (!qrCode) return null;
  return <QRCode value={qrCode} size={size} />;
}
const formatDateTime = (timestamp) => {
  const d = new Date(timestamp);

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
};
export default function App() {
  const [payment, setPayment] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const [timeLeft, setTimeLeft] = useState(0);
  const [expired, setExpired] = useState(false);

  const API = 'https://api.alowork.com/tingee';

  // ================= COUNTDOWN =================
  useEffect(() => {
    if (!payment?.expiredAt) return;

    const update = () => {
      const diff = Math.max(
        0,
        Math.floor((payment.expiredAt - Date.now()) / 1000)
      );

      setTimeLeft(diff);

      if (diff === 0) {
        setExpired(true);
      }
    };

    update(); // 🔥 chạy ngay (fix delay 1s)

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [payment]);

  // ================= HANDLE SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      alert('Số tiền không hợp lệ');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/makeQrCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'API lỗi');

      // 🔥 dùng expiredAt từ backend (KHÔNG tự tính nữa)
      setPayment(data.data);
      setExpired(false);

    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Tạo QR thanh toán</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="Nhập số tiền"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
        />

        <button disabled={loading}>
          {loading ? 'Đang tạo...' : 'Tạo QR'}
        </button>
      </form>

      {payment && (
        <div style={{ marginTop: 30 }}>
          <h3>Thông tin thanh toán</h3>

          <p>Số tiền: {payment.amount.toLocaleString()} VND</p>
          <p>Order: {payment.orderCode}</p>
          <p>Bank: {payment.bankName}</p>

          <TingeeQR qrCode={payment.qrCode} />

          <div style={{ marginTop: 10 }}>
            {expired ? (
              <span style={{ color: 'red' }}>Hết hạn</span>
            ) : (
              <>
                <div>Còn lại: {formatTime(timeLeft)}</div>

                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  Hết hạn lúc: {formatDateTime(payment.expiredAt)}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}