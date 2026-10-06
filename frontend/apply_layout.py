import re

file_path = r'c:\CODING\expensio\frontend\src\screens\DashboardScreen.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace everything from {/* Hero Balance Card */} up to but excluding {/* Upcoming Payments */}
pattern_ui = r'\{\/\* Hero Balance Card \*\/\}.*?(?=\{\/\* Upcoming Payments \*\/\})'

new_ui = """{/* Account Tabs */}
        <View style={styles.topTabsContainer}>
          <TouchableOpacity 
            style={[styles.topTab, activeTab === 'salary' ? styles.topTabActive : styles.topTabInactive]}
            onPress={() => setActiveTab('salary')}
          >
            <Feather name="briefcase" size={14} color={activeTab === 'salary' ? '#FFF' : '#64748B'} />
            <Text style={[styles.topTabText, activeTab === 'salary' ? styles.topTabTextActive : styles.topTabTextInactive]}>Salary</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.topTab, activeTab === 'cash' ? styles.topTabActive : styles.topTabInactive]}
            onPress={() => setActiveTab('cash')}
          >
            <Feather name="dollar-sign" size={14} color={activeTab === 'cash' ? '#FFF' : '#64748B'} />
            <Text style={[styles.topTabText, activeTab === 'cash' ? styles.topTabTextActive : styles.topTabTextInactive]}>Cash</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.topTab, activeTab === 'savings' ? styles.topTabActive : styles.topTabInactive]}
            onPress={() => setActiveTab('savings')}
          >
            <Feather name="pie-chart" size={14} color={activeTab === 'savings' ? '#FFF' : '#64748B'} />
            <Text style={[styles.topTabText, activeTab === 'savings' ? styles.topTabTextActive : styles.topTabTextInactive]}>Savings</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Account Card */}
        <View style={styles.newAccountCard}>
          {activeTab === 'salary' && (
            <>
              {/* Card Header */}
              <View style={styles.cardHeaderRow}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                  <View style={styles.cardHeaderIcon}>
                    <Feather name="briefcase" size={20} color="#209D84" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Salary Account</Text>
                    <Text style={styles.cardSub}>Your monthly earnings</Text>
                  </View>
                </View>
                <View style={styles.badgePrimary}>
                  <Text style={styles.badgePrimaryText}>PRIMARY</Text>
                </View>
              </View>

              {/* Middle Section */}
              <View style={styles.cardMiddleRow}>
                <View style={styles.balanceCol}>
                  <Text style={styles.labelRemaining}>REMAINING</Text>
                  <Text style={styles.mainBalance}>{formatters.currency(toRupees(salary.remaining))}</Text>
                  <Text style={styles.subBalance}>of {formatters.currency(toRupees(salary.salaryLimit))}</Text>
                </View>
                <View style={styles.chartCol}>
                  <View style={styles.progressCircle}>
                    <Text style={styles.progressPct}>{Math.round((salary.remaining/salary.salaryLimit)*100)}%</Text>
                    <Text style={styles.progressTxt}>Remaining</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardDivider} />

              {/* Bottom Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={styles.statIconRed}>
                    <Feather name="arrow-up-right" size={16} color="#E11D48" />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>SPENT THIS MONTH</Text>
                    <Text style={styles.statValue}>{formatters.currency(toRupees(salary.spentThisMonth))}</Text>
                  </View>
                </View>
                <View style={styles.statItem}>
                  <View style={styles.statIconBlue}>
                    <Feather name="credit-card" size={16} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>SALARY LIMIT</Text>
                    <Text style={styles.statValue}>{formatters.currency(toRupees(salary.salaryLimit))}</Text>
                  </View>
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.btnPrimary}>
                  <Feather name="repeat" size={16} color="#FFF" />
                  <Text style={styles.btnPrimaryText}>Transfer Money</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Expenses')}>
                  <Feather name="file-text" size={16} color="#209D84" />
                  <Text style={styles.btnSecondaryText}>View Transactions</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {activeTab === 'cash' && (
            <>
              <View style={styles.cardHeaderRow}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                  <View style={styles.cardHeaderIcon}>
                    <Feather name="dollar-sign" size={20} color="#209D84" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Cash Account</Text>
                    <Text style={styles.cardSub}>Physical currency</Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardMiddleRow}>
                <View style={styles.balanceCol}>
                  <Text style={styles.labelRemaining}>CASH BALANCE</Text>
                  <Text style={styles.mainBalance}>{formatters.currency(toRupees(cash.cashBalance))}</Text>
                </View>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={styles.statIconRed}>
                    <Feather name="arrow-up-right" size={16} color="#E11D48" />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>CASH SPENT</Text>
                    <Text style={styles.statValue}>{formatters.currency(toRupees(cash.cashSpent))}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Cash')}>
                  <Feather name="settings" size={16} color="#FFF" />
                  <Text style={styles.btnPrimaryText}>Manage Cash</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {activeTab === 'savings' && (
            <>
              <View style={styles.cardHeaderRow}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                  <View style={styles.cardHeaderIcon}>
                    <Feather name="pie-chart" size={20} color="#209D84" />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Total Savings</Text>
                    <Text style={styles.cardSub}>Your wealth</Text>
                  </View>
                </View>
                <View style={styles.badgePrimary}>
                  <Text style={styles.badgePrimaryText}>{savings.growthStatus.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.cardMiddleRow}>
                <View style={styles.balanceCol}>
                  <Text style={styles.labelRemaining}>CURRENT BALANCE</Text>
                  <Text style={styles.mainBalance}>{formatters.currency(toRupees(savings.totalSavings))}</Text>
                </View>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={styles.statIconBlue}>
                    <Feather name="trending-up" size={16} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>ACCUMULATED</Text>
                    <Text style={styles.statValue}>{formatters.currency(toRupees(savings.accumulated))}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Savings')}>
                  <Feather name="settings" size={16} color="#FFF" />
                  <Text style={styles.btnPrimaryText}>Manage Savings</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {activeTab === 'salary' && (
          <View style={styles.trackerBanner}>
            <View style={styles.trackerIconBox}>
              <Feather name="lightbulb" size={20} color="#059669" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.trackerTitle}>You're on track!</Text>
              <Text style={styles.trackerSub}>You've spent just {Math.round((salary.spentThisMonth/salary.salaryLimit)*100)}% of your salary this month.</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#64748B" />
          </View>
        )}

        """

content = re.sub(pattern_ui, new_ui, content, flags=re.DOTALL)

# 2. Replace old styles (Hero Card, Tabs, Dynamic Account Card)
pattern_styles = r'  // Hero Card.*?(?=  // Sections)'

new_styles = """  topTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  topTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  topTabActive: {
    backgroundColor: '#209D84',
  },
  topTabInactive: {
    backgroundColor: '#F1F5F9',
  },
  topTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  topTabTextActive: {
    color: '#FFFFFF',
  },
  topTabTextInactive: {
    color: '#64748B',
  },

  newAccountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  badgePrimary: {
    backgroundColor: '#E8F5F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgePrimaryText: {
    color: '#209D84',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceCol: {
    flex: 1,
  },
  labelRemaining: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 6,
  },
  mainBalance: {
    fontSize: 38,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
    marginBottom: 4,
  },
  subBalance: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  chartCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#209D84',
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  progressPct: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    transform: [{ rotate: '45deg' }],
  },
  progressTxt: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    transform: [{ rotate: '45deg' }],
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statIconRed: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#209D84',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5F3',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  btnSecondaryText: {
    color: '#209D84',
    fontSize: 14,
    fontWeight: '600',
  },
  trackerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FAFB',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 28,
  },
  trackerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 2,
  },
  trackerSub: {
    fontSize: 13,
    color: '#64748B',
  },

"""

content = re.sub(pattern_styles, new_styles, content, flags=re.DOTALL)

# 3. Clean up the old styles we left behind (Tabs and Account Card) because they are after // Sections
pattern_old_tabs = r'  // Account Tabs.*?(?=  // Transactions List)'
content = re.sub(pattern_old_tabs, '', content, flags=re.DOTALL)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
