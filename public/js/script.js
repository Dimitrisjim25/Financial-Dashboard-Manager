document.addEventListener('DOMContentLoaded', () => {
    // Στοιχεία DOM
    const form = document.getElementById('expenseForm');
    const tableBody = document.getElementById('expenseTableBody');
    const totalAmountEl = document.getElementById('totalAmount');
    const lastExpenseEl = document.getElementById('lastExpense');
    const refreshBtn = document.getElementById('refreshBtn');

    // Formatter για Ευρώ (Επαγγελματικό Format)
    const currencyFormatter = new Intl.NumberFormat('el-GR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
    });

    // Formatter για Ημερομηνίες
    const dateFormatter = new Intl.DateTimeFormat('el-GR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    // 1. Φόρτωση Δεδομένων
    async function fetchExpenses() {
        try {
            // Δείξε ότι φορτώνει (UX)
            refreshBtn.innerHTML = '<span class="material-symbols-outlined">sync</span> Φόρτωση...';
            
            const res = await fetch('/expenses');
            if (!res.ok) throw new Error('Αποτυχία φόρτωσης');
            
            const data = await res.json();
            
            renderTable(data);
            renderStats(data);

        } catch (error) {
            console.error('Error:', error);
            alert('Σφάλμα σύνδεσης με τον διακομιστή.');
        } finally {
            refreshBtn.innerHTML = '<span class="material-symbols-outlined">refresh</span> Ανανέωση';
        }
    }

    // 2. Εμφάνιση Πίνακα (Με κουμπί διαγραφής)
    function renderTable(expenses) {
        tableBody.innerHTML = '';
        
        if (expenses.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #64748b;">Δεν βρέθηκαν συναλλαγές.</td></tr>';
            return;
        }

        expenses.forEach(item => {
            const row = document.createElement('tr');
            
            const formattedDate = dateFormatter.format(new Date(item.createdAt));
            const formattedAmount = currencyFormatter.format(item.amount);
            
            row.innerHTML = `
                <td style="color: #64748b; font-size: 0.9em;">${formattedDate}</td>
                <td style="font-weight: 500;">${item.description}</td>
                <td class="text-right amount-cell">-${formattedAmount}</td>
                <td style="text-align: center;">
                    <button class="btn-delete" data-id="${item.id}" style="background:none; border:none; cursor:pointer; color: #94a3b8; transition: color 0.2s;">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Προσθήκη λειτουργίας στα κουμπιά διαγραφής
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                // Βρίσκουμε το ID από το κουμπί που πατήθηκε
                const id = e.currentTarget.getAttribute('data-id');
                deleteExpense(id);
            });
        });
    }

    // ΝΕΑ ΣΥΝΑΡΤΗΣΗ: Διαγραφή Εξόδου
    async function deleteExpense(id) {
        if(!confirm('Είσαι σίγουρος ότι θέλεις να διαγράψεις αυτό το έξοδο;')) return;

        try {
            const res = await fetch(`/expenses/${id}`, { method: 'DELETE' });
            
            if (res.ok) {
                fetchExpenses(); // Ξαναφορτώνουμε τη λίστα για να φύγει η γραμμή
            } else {
                alert('Αποτυχία διαγραφής');
            }
        } catch (error) {
            console.error(error);
            alert('Σφάλμα σύνδεσης');
        }
    }

    // 3. Εμφάνιση Στατιστικών
    function renderStats(expenses) {
        const total = expenses.reduce((sum, item) => sum + item.amount, 0);
        
        totalAmountEl.textContent = currencyFormatter.format(total);

        if (expenses.length > 0) {
            lastExpenseEl.textContent = expenses[0].description;
        } else {
            lastExpenseEl.textContent = '-';
        }
    }

    // 4. Υποβολή Φόρμας
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const descInput = document.getElementById('desc');
        const amountInput = document.getElementById('amount');
        const submitBtn = form.querySelector('button[type="submit"]');

        const payload = {
            description: descInput.value,
            amount: amountInput.value
        };

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Αποθήκευση...';

            const res = await fetch('/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                alert('⚠️ Προσοχή: ' + (data.error || 'Σφάλμα καταχώρησης'));
                return;
            }

            form.reset();
            fetchExpenses(); // Ανανέωση λίστας

        } catch (error) {
            console.error(error);
            alert('❌ Σφάλμα επικοινωνίας.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined">add</span> Καταχώρηση';
        }
    });

    // Events
    refreshBtn.addEventListener('click', fetchExpenses);

    // Εκκίνηση
    fetchExpenses();
});