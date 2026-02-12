document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('expenseForm');
    const tableBody = document.getElementById('expenseTableBody');
    const totalAmountEl = document.getElementById('totalAmount');
    const lastExpenseEl = document.getElementById('lastExpense');
    const refreshBtn = document.getElementById('refreshBtn');

    // Παίρνουμε το Token από το localStorage
    const token = localStorage.getItem('token');

    // Αν δεν υπάρχει token, τον διώχνουμε (για σιγουριά)
    if (!token) {
        window.location.href = 'login.html';
    }

    const currencyFormatter = new Intl.NumberFormat('el-GR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
    });

    const dateFormatter = new Intl.DateTimeFormat('el-GR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    // --- 1. GET Request (Φόρτωση) ---
    async function fetchExpenses() {
        try {
            refreshBtn.innerHTML = '<span class="material-symbols-outlined">sync</span> Φόρτωση...';
            
            // ΠΡΟΣΘΗΚΗ: Headers με Authorization
            const res = await fetch('/expenses', {
                method: 'GET',
                headers: {
                    'Authorization': token 
                }
            });

            // ΠΡΟΣΘΗΚΗ: Έλεγχος αν έληξε το session
            if (res.status === 401 || res.status === 403) {
                alert('Η συνεδρία έληξε. Παρακαλώ συνδεθείτε ξανά.');
                window.location.href = 'login.html';
                return;
            }

            if (!res.ok) throw new Error('Αποτυχία φόρτωσης');
            
            const data = await res.json();
            
            renderTable(data);
            renderStats(data);

        } catch (error) {
            console.error('Error:', error);
            // alert('Σφάλμα σύνδεσης με τον διακομιστή.'); // Προαιρετικό, για να μην πετάγεται συνέχεια
        } finally {
            refreshBtn.innerHTML = '<span class="material-symbols-outlined">refresh</span> Ανανέωση';
        }
    }

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

        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                deleteExpense(id);
            });
        });
    }

    // --- 2. DELETE Request (Διαγραφή) ---
    async function deleteExpense(id) {
        if(!confirm('Είσαι σίγουρος ότι θέλεις να διαγράψεις αυτό το έξοδο;')) return;

        try {
            // ΠΡΟΣΘΗΚΗ: Headers με Authorization
            const res = await fetch(`/expenses/${id}`, { 
                method: 'DELETE',
                headers: {
                    'Authorization': token
                }
            });
            
            if (res.ok) {
                fetchExpenses();
            } else {
                alert('Αποτυχία διαγραφής');
            }
        } catch (error) {
            console.error(error);
            alert('Σφάλμα σύνδεσης');
        }
    }

    function renderStats(expenses) {
        // Χρησιμοποιούμε parseFloat για σιγουριά ότι προσθέτουμε αριθμούς
        const total = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        
        totalAmountEl.textContent = currencyFormatter.format(total);

        if (expenses.length > 0) {
            lastExpenseEl.textContent = expenses[0].description;
        } else {
            lastExpenseEl.textContent = '-';
        }
    }

    // --- 3. POST Request (Καταχώρηση) ---
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

            // ΠΡΟΣΘΗΚΗ: Headers με Authorization
            const res = await fetch('/expenses', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token  // <--- Εδώ είναι το κλειδί
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                alert('⚠️ Προσοχή: ' + (data.error || 'Σφάλμα καταχώρησης'));
                return;
            }

            form.reset();
            fetchExpenses();

        } catch (error) {
            console.error(error);
            alert('❌ Σφάλμα επικοινωνίας.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined">add</span> Καταχώρηση';
        }
    });

    refreshBtn.addEventListener('click', fetchExpenses);

    // Εκκίνηση
    fetchExpenses();
});