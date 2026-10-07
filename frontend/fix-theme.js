const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');

// The new components logic for the "Coming Soon" screens
const getReplacementContent = (screenName, title, subtitle, iconName, oldContent) => {
  // Regex to extract parts or just do string replacement
  const oldReturnBlock = oldContent.match(/return \([\s\S]*?\);\n}/)[0];
  const oldStylesBlock = oldContent.match(/const styles = StyleSheet\.create\(\{[\s\S]*\}\);/)[0];

  const newReturnBlock = `return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      
      {/* Background Gradient */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#F8FAFC', '#F1F5F9']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.container}>
        {/* Title Bar */}
        <View style={styles.screenTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => { haptics.selection(); openDrawer(); }} style={styles.menuBtn}>
              <Feather name="menu" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View>
              <Text style={styles.screenHeading}>${title}</Text>
              <Text style={styles.screenSubheading}>${subtitle}</Text>
            </View>
          </View>
        </View>

        {/* Empty State Card */}
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Feather name="${iconName}" size={32} color="#10B981" />
          </View>
          <Text style={styles.titleText}>${title} Coming Soon</Text>
          <Text style={styles.subtitleText}>
            We are working hard to bring you the best ${title.toLowerCase()} experience. 
            Stay tuned for the next update!
          </Text>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.85}
            onPress={() => haptics.light()}
          >
            <Text style={styles.actionBtnText}>Notify Me</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}`;

  const newStylesBlock = `const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, paddingHorizontal: 24 },
  screenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 44 : 20,
    marginBottom: 24,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginRight: 16,
  },
  screenHeading: { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  screenSubheading: { fontSize: 12.5, color: '#64748B', fontWeight: '500', marginTop: 2 },
  
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  titleText: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  subtitleText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  actionBtn: {
    backgroundColor: '#10B981', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16,
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 2,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});`;

  let newContent = oldContent.replace(oldReturnBlock, newReturnBlock);
  newContent = newContent.replace(oldStylesBlock, newStylesBlock);
  
  return newContent;
};

const screensToUpdate = [
  { file: 'EmisScreen.tsx', title: 'EMIs', subtitle: 'Track your loans and installments', icon: 'dollar-sign' },
  { file: 'FriendsScreen.tsx', title: 'Friends', subtitle: 'Manage your splits and friends', icon: 'users' },
  { file: 'GoalsScreen.tsx', title: 'Goals', subtitle: 'Set and track financial goals', icon: 'target' },
];

screensToUpdate.forEach(screen => {
  const filePath = path.join(screensDir, screen.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes("Budgets Coming Soon") || content.includes("Coming Soon")) {
      const newContent = getReplacementContent(screen.file.replace('.tsx', ''), screen.title, screen.subtitle, screen.icon, content);
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log("Updated " + screen.file);
    } else {
        console.log("Skipped " + screen.file + ", didn't match coming soon pattern");
    }
  }
});

// Also fix some screens that might just be using the wrong gradient colors
const otherScreensToFix = [
  'AuthScreen.tsx', 'ExpensesScreen.tsx', 'OnboardingProfileScreen.tsx', 
  'ProfileScreen.tsx', 'SplitsScreen.tsx', 'SubscriptionsScreen.tsx'
];

otherScreensToFix.forEach(file => {
  const filePath = path.join(screensDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes("['#022C22', '#064E3B', '#0F766E']")) {
       content = content.replace(/colors=\{\['#022C22', '#064E3B', '#0F766E'\]\}/g, "colors={['#F8FAFC', '#F1F5F9']}");
       fs.writeFileSync(filePath, content, 'utf8');
       console.log("Fixed gradient in " + file);
    }
  }
});
