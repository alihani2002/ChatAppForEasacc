    $(document).ready(function() {
        // Update statistics
        updateStatistics();

    // Initialize filters
    initFilters();

    // Auto-refresh every 30 seconds
    setInterval(updateStatistics, 30000);
        });

    function updateStatistics() {
            const sessions = Json.Serialize(Model);
            const activeSessions = sessions.filter(s => !s.isClosed).length;
            const closedSessions = sessions.filter(s => s.isClosed).length;

    // Update counters
    $('#activeSessions').text(activeSessions);
    $('#activeUsers').text(activeSessions);
    $('#pendingSessions').text(activeSessions);

    // Calculate average response time (mock data for now)
    const avgTime = calculateAverageResponseTime(sessions);
    $('#avgResponseTime').text(avgTime + 's');
        }

    function calculateAverageResponseTime(sessions) {
            // Mock calculation - replace with actual logic
            return Math.floor(Math.random() * 30) + 5;
        }

    function initFilters() {
        // Search filter
        $('#searchInput').on('keyup', function () {
            const searchText = $(this).val().toLowerCase();
            filterTable(searchText);
        });

    // Status filter
    $('#statusFilter').on('change', function() {
        filterTable();
            });

    // Sort filter
    $('#sortFilter').on('change', function() {
        sortTable();
            });
        }

    function filterTable(searchText = '') {
            const status = $('#statusFilter').val();
    let visibleCount = 0;

    $('tbody tr').each(function() {
                const row = $(this);
    const rowStatus = row.data('status');
    const userName = row.find('h6').text().toLowerCase();
    const userId = row.data('user').toString().toLowerCase();
    const matchesSearch = searchText === '' ||
    userName.includes(searchText) ||
    userId.includes(searchText);
    const matchesStatus = status === 'all' || rowStatus === status;

    if (matchesSearch && matchesStatus) {
        row.show();
    visibleCount++;
                } else {
        row.hide();
                }
            });

    $('#showingCount').text(visibleCount);

    // Show empty state if no results
    if (visibleCount === 0) {
        showEmptyState();
            }
        }

    function sortTable() {
            const sortBy = $('#sortFilter').val();
    const tbody = $('tbody');
    const rows = tbody.find('tr').get();

    rows.sort(function(a, b) {
                const aData = $(a);
    const bData = $(b);

    switch(sortBy) {
                    case 'newest':
    const aTime = new Date(aData.data('time') || 0);
    const bTime = new Date(bData.data('time') || 0);
    return bTime - aTime;

    case 'oldest':
    const aTime2 = new Date(aData.data('time') || 0);
    const bTime2 = new Date(bData.data('time') || 0);
    return aTime2 - bTime2;

    case 'messages':
    return bData.data('messages') - aData.data('messages');

    default:
    return 0;
                }
            });

    $.each(rows, function(index, row) {
        tbody.append(row);
            });
        }

    function showEmptyState() {
            if ($('.empty-state').length === 0) {
        $('tbody').append(`
                    <tr>
                        <td colspan="5" class="text-center py-5">
                            <div class="empty-state">
                                <div class="empty-icon mb-3">
                                    <i class="fas fa-comments fa-3x text-muted"></i>
                                </div>
                                <h5 class="text-muted mb-2">لا توجد نتائج</h5>
                                <p class="text-muted">جرب تغيير معايير البحث</p>
                            </div>
                        </td>
                    </tr>
                `);
            }
        }

    function refreshDashboard() {
            const btn = $('.btn-refresh');
    const icon = btn.find('i');

    // Add rotation animation
    btn.addClass('refreshing');
    icon.addClass('fa-spin');

            // Simulate refresh
            setTimeout(() => {
        location.reload();
            }, 1000);
        }

    function openHistory(userId) {
        // Show loading
        $('#historyBody').html(`
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">جاري التحميل...</span>
                    </div>
                </div>
            `);

    // Fetch history
    fetch(`/Chat/UserChats?userId=${userId}`)
                .then(res => res.text())
                .then(html => {
        $('#historyBody').html(html);

    // Show modal
    const modal = new bootstrap.Modal($('#historyModal')[0]);
    modal.show();
                })
                .catch(err => {
        $('#historyBody').html(`
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            حدث خطأ في تحميل السجل
                        </div>
                    `);
                });
        }

    function closeSession(sessionId) {
        // Store session ID for confirmation
        $('#confirmModal').data('sessionId', sessionId);

    // Show confirmation modal
    const modal = new bootstrap.Modal($('#confirmModal')[0]);
    modal.show();
        }

    // Confirm close action
    $('#confirmCloseBtn').click(function() {
            const sessionId = $('#confirmModal').data('sessionId');

    // Send close request
    fetch(`/Chat/CloseSession?id=${sessionId}`, {
        method: 'POST',
    headers: {
        'Content-Type': 'application/json',
                }
            })
            .then(res => {
                if (res.ok) {
                    // Update UI
                    const row = $(`tr[data-session="${sessionId}"]`);
    row.find('.status-badge')
    .removeClass('status-live')
    .addClass('status-closed')
    .html('<i class="fas fa-check-circle me-1"></i>مغلقة');

    // Remove close button
    row.find('button[onclick*="closeSession"]').remove();

    // Hide modal
    bootstrap.Modal.getInstance($('#confirmModal')[0]).hide();

    // Show success message
    showToast('success', 'تم إغلاق المحادثة بنجاح');
                } else {
        showToast('error', 'حدث خطأ في إغلاق المحادثة');
                }
            })
            .catch(err => {
        showToast('error', 'حدث خطأ في الاتصال');
            });
        });

    function showToast(type, message) {
            // Create toast
            const toastHtml = `
    <div class="toast align-items-center text-white bg-${type} border-0 position-fixed top-0 end-0 m-3" role="alert">
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    </div>
    `;

    $('body').append(toastHtml);

    // Show toast
    const toast = new bootstrap.Toast($('.toast').last()[0]);
    toast.show();

    // Remove after hide
    $('.toast').last().on('hidden.bs.toast', function() {
        $(this).remove();
            });
        }

    // Keep only latest session per user
    document.addEventListener("DOMContentLoaded", function () {
            const rows = document.querySelectorAll("#chatTable tr");
    const latestSessionPerUser = { };

            rows.forEach(row => {
                const userId = row.dataset.user;
    const sessionId = parseInt(row.dataset.session);

    if (!latestSessionPerUser[userId] ||
    latestSessionPerUser[userId].sessionId < sessionId) {
        latestSessionPerUser[userId] = {
            sessionId: sessionId,
            row: row
        };
                }
            });

            rows.forEach(row => {
                const userId = row.dataset.user;
    const sessionId = parseInt(row.dataset.session);

    if (latestSessionPerUser[userId].sessionId !== sessionId) {
        row.remove();
                }
            });
        });
