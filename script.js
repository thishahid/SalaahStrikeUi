// --- Today's Progress Functionality ---
const progressState = {
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: false,
    Isha: false
};

function updateProgressUI() {
    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    let completed = 0;
    prayers.forEach(prayer => {
        // Update progress buttons
        const btn = document.querySelector(`.progress-btn[data-prayer="${prayer}"]`);
        if (btn) {
            let icon = btn.querySelector('i');
            btn.classList.remove('bg-emerald-100', 'bg-rose-100', 'bg-amber-100');
            icon.className = '';
            if (progressState[prayer]) {
                btn.classList.add('bg-emerald-100');
                icon.classList.add('fas', 'fa-check', 'text-emerald-600', 'text-xs');
            } else {
                if (prayer === 'Maghrib') {
                    btn.classList.add('bg-rose-100');
                    icon.classList.add('fas', 'fa-times', 'text-rose-500', 'text-xs');
                } else if (prayer === 'Isha') {
                    btn.classList.add('bg-amber-100');
                    icon.classList.add('fas', 'fa-clock', 'text-amber-500', 'text-xs');
                } else {
                    btn.classList.add('bg-rose-100');
                    icon.classList.add('fas', 'fa-times', 'text-rose-500', 'text-xs');
                }
            }
        }
        // Update prayer cards
        document.querySelectorAll('.prayer-card').forEach(card => {
            const h4 = card.querySelector('h4');
            if (h4 && h4.textContent.trim() === prayer) {
                const status = card.querySelector('.prayer-status');
                // Remove all border colors
                card.classList.remove('border-emerald-500', 'border-rose-500', 'border-amber-500');
                if (progressState[prayer]) {
                    card.classList.add('border-emerald-500');
                    if (status) {
                        status.textContent = 'Completed';
                        status.classList.remove('text-rose-600', 'text-amber-600');
                        status.classList.add('text-emerald-600');
                    }
                    completed++;
                } else {
                    // Missed/Upcoming logic for non-completed
                    if (prayer === 'Maghrib') {
                        card.classList.add('border-rose-500');
                        if (status) {
                            status.textContent = 'Missed';
                            status.classList.remove('text-emerald-600', 'text-amber-600');
                            status.classList.add('text-rose-600');
                        }
                    } else if (prayer === 'Isha') {
                        card.classList.add('border-amber-500');
                        if (status) {
                            status.textContent = 'Upcoming';
                            status.classList.remove('text-emerald-600', 'text-rose-600');
                            status.classList.add('text-amber-600');
                        }
                    } else {
                        card.classList.add('border-rose-500');
                        if (status) {
                            status.textContent = 'Missed';
                            status.classList.remove('text-emerald-600', 'text-amber-600');
                            status.classList.add('text-rose-600');
                        }
                    }
                }
            }
        });
    });
    // Update progress circle and count
    const percent = Math.round((completed / 5) * 100);
    const progressCircle = document.querySelector('.prayer-progress');
    if (progressCircle) progressCircle.style.setProperty('--progress', percent + '%');
    const progressCount = document.querySelector('.prayer-progress + .absolute span.text-3xl');
    if (progressCount) progressCount.textContent = `${completed}/5`;
    const progressLabel = document.querySelector('.font-medium.text-gray-700 + span');
    if (progressLabel) progressLabel.textContent = `${percent}% complete`;
}

document.addEventListener('DOMContentLoaded', function() {
    // Progress tick/cross toggle
    document.querySelectorAll('.progress-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const prayer = this.getAttribute('data-prayer');
            progressState[prayer] = !progressState[prayer];
            updateProgressUI();
        });
    });
    updateProgressUI();

    // Simple script to handle prayer time updates
    // Fetch prayer times for Indore from Aladhan API
    let prayerTimes = {};
    let nextPrayerName = '';
    let nextPrayerTime = '';
    let nextPrayerDate = null;

    function fetchPrayerTimes() {
        fetch('http://api.aladhan.com/v1/timingsByCity?city=Indore&country=India&method=2')
            .then(response => response.json())
            .then(data => {
                if (data.code === 200) {
                    prayerTimes = data.data.timings;
                    updatePrayerCards();
                    updateUpcomingPrayer();
                }
            })
            .catch(err => {
                console.error('Failed to fetch prayer times:', err);
            });
    }

    function getNextPrayer() {
        const order = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        const now = new Date();
        for (let i = 0; i < order.length; i++) {
            const timeStr = prayerTimes[order[i]];
            if (!timeStr) continue;
            const [h, m] = timeStr.split(':').map(Number);
            const prayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
            if (now < prayerDate) {
                return { name: order[i], time: timeStr, date: prayerDate };
            }
        }
        // If all passed, return tomorrow's Fajr
        const [h, m] = prayerTimes['Fajr'].split(':').map(Number);
        const prayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, h, m, 0, 0);
        return { name: 'Fajr', time: prayerTimes['Fajr'], date: prayerDate };
    }

    function updateUpcomingPrayer() {
        if (!prayerTimes.Fajr) return;
        const { name, time, date } = getNextPrayer();
        nextPrayerName = name;
        nextPrayerTime = time;
        nextPrayerDate = date;
        const now = new Date();
        const diff = date - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const el = document.querySelector('.upcoming-prayer-time');
        if (el) {
            el.textContent = `Starts in ${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
        }
        // Also update the prayer name and time in the upcoming prayer card
        const nameEl = document.querySelector('.bg-gradient-to-r h3');
        if (nameEl) nameEl.textContent = name;
        const timeEl = document.querySelector('.bg-gradient-to-r .text-3xl');
        if (timeEl) timeEl.textContent = time;
    }

    function updatePrayerCards() {
        // Update the times in the prayer cards
        const mapping = [
            { selector: 'Fajr', time: prayerTimes.Fajr },
            { selector: 'Dhuhr', time: prayerTimes.Dhuhr },
            { selector: 'Asr', time: prayerTimes.Asr },
            { selector: 'Maghrib', time: prayerTimes.Maghrib },
            { selector: 'Isha', time: prayerTimes.Isha },
        ];
        document.querySelectorAll('.prayer-card').forEach(card => {
            const h4 = card.querySelector('h4');
            const timeEl = card.querySelector('.text-right .font-medium');
            if (h4 && timeEl) {
                const found = mapping.find(m => m.selector === h4.textContent.trim());
                if (found && found.time) {
                    timeEl.textContent = found.time;
                }
            }
        });
        // Update the progress circle times if needed (not implemented here)
    }

    fetchPrayerTimes();
    setInterval(() => {
        updateUpcomingPrayer();
    }, 60000); // Update every minute
    
    // Remove old prayer card click handler (now handled by progress buttons)
    // ...existing code for prayer completion toggle and other features...
});