import { useState, useEffect, useMemo } from 'react';
import { QRCode } from 'react-qr-code';

// ================= QR COMPONENT =================
function TingeeQR({ qrCode, size = 256 }) {
  if (!qrCode) return null;
  return <QRCode value={qrCode} size={size} />;
}

// ================= VIETNAM BANK LIST =================
const VIETNAM_BANKS = [
  "Vietcombank (VCB)",
  "BIDV",
  "VietinBank",
  "Agribank",
  "MB Bank",
  "Techcombank (TCB)",
  "ACB",
  "VPBank",
  "TPBank",
  "Sacombank",
  "SHB",
  "HDBank",
  "OCB",
  "Eximbank",
  "MSB",
  "SeABank",
  "Nam A Bank",
  "VIB",
  "PVcomBank",
  "KienlongBank",
  "ABBANK",
  "NCB",
  "Saigonbank",
  "BaoViet Bank",
  "CBBank",
  "VRB",
  "Public Bank VN"
];

// ================= CLEAN & VALIDATE =================
function cleanSenderName(name) {
  if (!name) return '';

  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function isValidName(name) {
  if (!name) return false;

  const words = name.split(' ').filter(Boolean);

  // 2–5 từ là hợp lý
  if (words.length < 2 || words.length > 5) return false;

  // chặn noise spam
  const noise = ['TEST', 'ABC', 'XYZ', 'QWE', 'ASD', 'ZXC', 'AAAA', 'BBBB'];

  // mỗi từ hợp lệ:
  const isValidWord = (w) => {
    // cho phép:
    // - 1 ký tự (A, B, C...)
    // - hoặc >= 2 ký tự chữ
    return /^[A-Z]$/.test(w) || /^[A-Z]{2,}$/.test(w);
  };

  // check word validity
  if (!words.every(isValidWord)) return false;

  // check noise words
  if (words.some(w => noise.includes(w))) return false;

  // tránh toàn chữ giống nhau (AAAA AAAA)
  const unique = new Set(words);
  if (unique.size === 1) return false;

  return true;
}

function cleanBankAccount(acc) {
  return acc.replace(/\D/g, '');
}

function isValidAccount(acc) {
  return /^\d{6,20}$/.test(acc);
}

// ================= APP =================
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

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${API_BASE}/tingee/payments`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.payments);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  };

  // ================= HANDLE SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanName = cleanSenderName(senderName);
    const cleanAcc = cleanBankAccount(bankAccount);

    if (!isValidName(cleanName)) {
      alert('Tên không hợp lệ (2-5 từ, không ký tự lạ)');
      return;
    }

    if (!isValidAccount(cleanAcc)) {
      alert('Số tài khoản không hợp lệ');
      return;
    }

    if (!bankName) {
      alert('Vui lòng chọn ngân hàng');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert('Số tiền không hợp lệ');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/tingee/makeQrCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          senderName: cleanName,
          bankAccount: cleanAcc,
          bankName
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || 'Lỗi khi tạo phiếu thanh toán');
      }

      const p = await response.json();
      const newPayment = p.data;

      setPayment(newPayment);
      setQrUrl(String(newPayment.qrCode));
      setHistory([newPayment, ...history]);

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="page-shell">
      <header className="hero">
        <span className="eyebrow">
          Hệ thống QR chuyển khoản ngân hàng
        </span>
      </header>

      <main className="main-grid">
        <section className="card form-card">
          <div className="card-title">Tạo phiếu thanh toán</div>

          <form onSubmit={handleSubmit} className="form-grid">

            <label>
              <span>Tên người chuyển (giống tên tài khoản ngân hàng)</span>
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="NGUYEN VAN A"
                required
              />
            </label>

            <label>
              <span>Số tài khoản</span>
              <input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Nhập số tài khoản"
                required
              />
            </label>

            <label>
              <span>Ngân hàng</span>
              <BankDropdown
                value={bankName}
                onChange={setBankName}
              />
            </label>

            <label>
              <span>Số tiền</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>

            <button disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo QR'}
            </button>

          </form>
        </section>

        <section className="card summary-card">
          {!payment ? (
            <div>Chưa có phiên</div>
          ) : (
            <>
              <div>{payment.senderName}</div>
              <div>{payment.bankAccount}</div>
              <div>{payment.bankName}</div>
              <div>{payment.amount.toLocaleString()} VND</div>

              {qrUrl && <TingeeQR qrCode={qrUrl} size={200} />}
            </>
          )}
        </section>
      </main>
    </div>
  );
}



function BankDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredBanks = useMemo(() => {
    return VIETNAM_BANKS.filter(bank =>
      bank.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div style={{ position: "relative" }}>

      {/* INPUT DISPLAY */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: 8,
          cursor: "pointer",
          background: "#fff"
        }}
      >
        {value || "Chọn ngân hàng"}
      </div>

      {/* DROPDOWN */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            right: 0,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#fff",
            zIndex: 999,
            maxHeight: 250,
            overflowY: "auto",
            boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
          }}
        >

          {/* SEARCH */}
          <input
            autoFocus
            placeholder="Tìm ngân hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "none",
              borderBottom: "1px solid #eee",
              outline: "none"
            }}
          />

          {/* LIST */}
          {filteredBanks.map((bank, idx) => (
            <div
              key={idx}
              onClick={() => {
                onChange(bank);
                setOpen(false);
                setSearch("");
              }}
              style={{
                padding: "10px",
                cursor: "pointer",
                borderBottom: "1px solid #f5f5f5"
              }}
            >
              {bank}
            </div>
          ))}

          {filteredBanks.length === 0 && (
            <div style={{ padding: 10, color: "#999" }}>
              Không tìm thấy ngân hàng
            </div>
          )}

        </div>
      )}
    </div>
  );
}