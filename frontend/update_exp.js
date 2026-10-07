const fs = require('fs');

try {
  let exp = fs.readFileSync('src/screens/ExpensesScreen.tsx', 'utf-8');
  
  // 1. Simplify Hero Card
  const heroRegex = /\{\/\* 1\. HERO APPLE LIQUID GLASS CARD \*\/\}[\s\S]*?\{\/\* 2\. CATEGORY FILTER CHIPS \*\/\}/;
  const newHero = `      {/* 1. HERO CARD */}
      <View style={styles.heroGlassCard}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.02)']}
          style={styles.heroCardInner}
        >
          <Text style={styles.totalSpendLabel}>TOTAL SPENT THIS MONTH</Text>
          <Text style={styles.totalSpendAmount}>{formatters.currency(totalSpend)}</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelsRow}>
              <Text style={styles.progressRemainingText}>
                LIMIT: {formatters.currency(rawSalary)}
              </Text>
              <Text style={styles.leftLabelText}>REMAINING: {formatters.currency(remainingBudget)}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* 2. CATEGORY FILTER CHIPS */}`;
  exp = exp.replace(heroRegex, newHero);

  // 2. Add Floating Action Button just before <TransactionSheet />
  const fabJSX = `      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fabBtn}
        activeOpacity={0.8}
        onPress={() => {
          haptics.medium();
          setEditingTx(null);
          setIsSheetOpen(true);
        }}
      >
        <Feather name="plus" size={24} color="#FFF" />
      </TouchableOpacity>
`;
  exp = exp.replace(/<TransactionSheet/g, fabJSX + "      <TransactionSheet");

  // 3. Make Transaction Card Clickable
  const cardRegex = /<View style=\{styles\.txCard\}>([\s\S]*?)<\/View>\s*<\/SwipeableRow>/g;
  exp = exp.replace(cardRegex, (match, p1) => {
    return `<TouchableOpacity activeOpacity={0.7} onPress={() => { haptics.medium(); setEditingTx(item); setIsSheetOpen(true); }}><View style={styles.txCard}>${p1}</View></TouchableOpacity>\n        </SwipeableRow>`;
  });

  // 4. Add FAB styles
  const stylesRegex = /const styles = StyleSheet\.create\(\{/;
  const fabStyles = `const styles = StyleSheet.create({
  fabBtn: {
    position: 'absolute',
    bottom: 100, // Just above the bottom tab bar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
`;
  exp = exp.replace(stylesRegex, fabStyles);
  
  fs.writeFileSync('src/screens/ExpensesScreen.tsx', exp);
  console.log('Successfully updated ExpensesScreen.tsx');
} catch (e) {
  console.error(e);
}
