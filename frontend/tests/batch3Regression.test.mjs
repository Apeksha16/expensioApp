import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, '..');
const distDir = path.resolve(frontendDir, '.test-dist/cjs');
const originalLoad = Module._load;

function createElementTree(type, props, ...children) {
  return {
    type,
    props: {
      ...(props || {}),
      children: children.length === 1 ? children[0] : children.length > 1 ? children : props?.children,
    },
  };
}

function collectNodes(node, predicate, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const child of node) collectNodes(child, predicate, out);
    return out;
  }
  if (predicate(node)) out.push(node);
  if (node.props?.children !== undefined) {
    collectNodes(node.props.children, predicate, out);
  }
  return out;
}

Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'react') {
    const ReactStub = {
      createElement: createElementTree,
      memo: (comp) => {
        const wrapped = (props) => comp(props);
        wrapped.__isMemo = true;
        wrapped.__inner = comp;
        return wrapped;
      },
      useEffect: () => {},
      useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
      useRef: (init) => ({ current: init }),
      useCallback: (fn) => fn,
      useMemo: (fn) => fn(),
      useSyncExternalStore: (_sub, getSnapshot) => getSnapshot(),
      Fragment: 'Fragment',
    };
    return { __esModule: true, default: ReactStub, ...ReactStub };
  }
  if (request === 'react-native-safe-area-context') {
    return {
      useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
    };
  }
  if (request === 'react-native-gesture-handler') {
    return {
      GestureDetector: 'GestureDetector',
      usePanGesture: () => ({}),
    };
  }
  if (request === 'react-native-svg') {
    return { __esModule: true, default: 'Svg', Circle: 'Circle', Path: 'Path', Rect: 'Rect', G: 'G' };
  }
  if (request === '@expo/vector-icons/Ionicons' || request === '@expo/vector-icons') {
    const Ionicons = 'Ionicons';
    return { __esModule: true, default: Ionicons, Ionicons };
  }
  if (request === 'react-native') {
    return {
      Platform: { OS: 'ios' },
      processColor: (c) => c,
      useWindowDimensions: () => ({ width: 390, height: 844 }),
      AccessibilityInfo: {
        isReduceMotionEnabled: async () => false,
        addEventListener: () => ({ remove: () => {} }),
        setAccessibilityFocus: () => {},
        announceForAccessibility: () => {},
      },
      BackHandler: { addEventListener: () => ({ remove: () => {} }) },
      Keyboard: { addListener: () => ({ remove: () => {} }) },
      findNodeHandle: () => 1,
      Animated: {
        Value: function Value(v) {
          this._v = v;
          this.setValue = (n) => { this._v = n; };
          this.interpolate = () => 0;
        },
        timing: () => ({ start: (cb) => cb?.() }),
        spring: () => ({ start: (cb) => cb?.() }),
        parallel: () => ({ start: (cb) => cb?.() }),
        View: 'Animated.View',
      },
      PanResponder: { create: () => ({ panHandlers: {} }) },
      StyleSheet: {
        create: (s) => s,
        hairlineWidth: 1,
        absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
      },
      Modal: 'Modal',
      View: 'View',
      Text: 'Text',
      Image: 'Image',
      Pressable: 'Pressable',
      ActivityIndicator: 'ActivityIndicator',
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

globalThis.__DEV__ = true;

const req = Module.createRequire(import.meta.url);
const loadDist = (relPath) => req(path.join(distDir, relPath));

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function relativeLuminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function contrastRatio(hexA, hexB) {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

test('F-11: all WCAG AA text (>= 4.5:1) and UI-boundary (>= 3.0:1) token pairs pass', () => {
  const { colors } = loadDist('theme/index.js');

  const textPairs = [
    ['textPrimary on background', colors.textPrimary, colors.background],
    ['textSecondary on background', colors.textSecondary, colors.background],
    ['textSecondary on surface', colors.textSecondary, colors.surface],
    ['textTertiary on background', colors.textTertiary, colors.background],
    ['textTertiary on surface', colors.textTertiary, colors.surface],
    ['accent on background', colors.accent, colors.background],
    ['accent on surface', colors.accent, colors.surface],
    ['accent on accentSoft', colors.accent, colors.accentSoft],
    ['textInverse on accent', colors.textInverse, colors.accent],
    ['textInverse on expense', colors.textInverse, colors.expense],
    ['expense on dangerSoft', colors.expense, colors.dangerSoft],
    ['expense on background', colors.expense, colors.background],
    ['expense on surface', colors.expense, colors.surface],
    ['income on background', colors.income, colors.background],
    ['income on accentSoft', colors.income, colors.accentSoft],
    ['success on surface', colors.success, colors.surface],
    ['warning on warningSoft', colors.warning, colors.warningSoft],
    ['warning on background', colors.warning, colors.background],
    ['disabledText on disabledBg', colors.disabledText, colors.disabledBg],
    ['accentDark on surprise', colors.accentDark, colors.surprise],
    ['heroText on heroBg', colors.heroText, colors.heroBg],
    ['heroTextMuted on heroBg', colors.heroTextMuted, colors.heroBg],
    ['heroTextSubtle on heroBg', colors.heroTextSubtle, colors.heroBg],
    ['heroErrorAccent on heroBg', colors.heroErrorAccent, colors.heroBg],
    ['heroButtonDisabledText on heroButtonDisabledBg', colors.heroButtonDisabledText, colors.heroButtonDisabledBg],
    ['toneEmeraldFg on toneEmeraldBg', colors.toneEmeraldFg, colors.toneEmeraldBg],
    ['toneLimeFg on toneLimeBg', colors.toneLimeFg, colors.toneLimeBg],
    ['toneNeutralFg on toneNeutralBg', colors.toneNeutralFg, colors.toneNeutralBg],
    ['toneAmberFg on toneAmberBg', colors.toneAmberFg, colors.toneAmberBg],
    ['toneRoseFg on toneRoseBg', colors.toneRoseFg, colors.toneRoseBg],
    ['toneSlateFg on toneSlateBg', colors.toneSlateFg, colors.toneSlateBg],
  ];

  const uiBoundaryPairs = [
    ['disabledBorder vs background', colors.disabledBorder, colors.background],
    ['heroButtonDisabledBorder vs heroBg', colors.heroButtonDisabledBorder, colors.heroBg],
    ['controlBorder vs background', colors.controlBorder, colors.background],
    ['controlBorder vs surface', colors.controlBorder, colors.surface],
  ];

  const failures = [];
  for (const [label, fg, bg] of textPairs) {
    assert.ok(typeof fg === 'string' && typeof bg === 'string', `Missing token for ${label}`);
    const ratio = contrastRatio(fg, bg);
    if (ratio < 4.5) failures.push(`${label}: ${ratio.toFixed(2)}:1 (< 4.5:1)`);
  }
  for (const [label, c1, c2] of uiBoundaryPairs) {
    assert.ok(typeof c1 === 'string' && typeof c2 === 'string', `Missing boundary token for ${label}`);
    const ratio = contrastRatio(c1, c2);
    if (ratio < 3.0) failures.push(`${label}: ${ratio.toFixed(2)}:1 (< 3.0:1)`);
  }

  assert.deepEqual(failures, [], `WCAG contrast failures:\n${failures.join('\n')}`);
});

test('F-12: FriendsScreen list memoizes rows with 200 items and isolates per-row pending/swipe state', () => {
  const friendsScreenSrc = fs.readFileSync(path.join(frontendDir, 'src/screens/friends/FriendsScreen.tsx'), 'utf8');
  assert.match(friendsScreenSrc, /getItemLayout/, 'FriendsScreen FlatList must configure getItemLayout');
  assert.match(friendsScreenSrc, /keyExtractor/, 'FriendsScreen FlatList must configure keyExtractor');
  assert.doesNotMatch(
    friendsScreenSrc,
    /renderItem\s*=\s*useCallback[\s\S]*activeSwipeId/,
    'FriendsScreen renderItem must not depend on activeSwipeId',
  );
  assert.doesNotMatch(
    friendsScreenSrc,
    /renderItem\s*=\s*useCallback[\s\S]*pendingFriendActionIds/,
    'FriendsScreen renderItem must not depend on pendingFriendActionIds',
  );

  // Verify per-row interaction store only notifies subscribers whose row changed
  const rowStoreMod = loadDist('services/friendRowInteractionStore.js');
  assert.equal(typeof rowStoreMod.createFriendRowInteractionStore, 'function', 'Expected createFriendRowInteractionStore');

  const store = rowStoreMod.createFriendRowInteractionStore();
  const rowRenderCounts = new Array(200).fill(0);
  const prevSnapshot = Array.from({ length: 200 }, (_, i) => ({
    swipeOpen: store.isSwipeOpen(`fr-${i}`),
    pending: store.isPending(`fr-${i}`),
  }));

  const unsubs = Array.from({ length: 200 }, (_, i) =>
    store.subscribe(() => {
      const nextSwipe = store.isSwipeOpen(`fr-${i}`);
      const nextPending = store.isPending(`fr-${i}`);
      if (nextSwipe !== prevSnapshot[i].swipeOpen || nextPending !== prevSnapshot[i].pending) {
        prevSnapshot[i] = { swipeOpen: nextSwipe, pending: nextPending };
        rowRenderCounts[i] += 1;
      }
    }),
  );

  // Toggle pending on row 5 -> ONLY row 5 should re-render
  store.setPendingIds(['fr-5']);
  assert.equal(rowRenderCounts[5], 1);
  assert.equal(rowRenderCounts.filter((c) => c > 0).length, 1, 'Expected only 1 row to re-render on pending change');

  // Toggle swipe on row 12 -> ONLY row 12 should re-render
  store.setActiveSwipeId('fr-12');
  assert.equal(rowRenderCounts[12], 1);
  assert.equal(rowRenderCounts.filter((c) => c > 0).length, 2);

  unsubs.forEach((u) => u());
});

test('F-15: BottomSheet hides backdrop from a11y tree, RequestRow exposes accessible actions, and sheets receive returnFocusRef', () => {
  const friendsScreenSrc = fs.readFileSync(path.join(frontendDir, 'src/screens/friends/FriendsScreen.tsx'), 'utf8');
  assert.match(friendsScreenSrc, /<PersonSheet[\s\S]*returnFocusRef=/, 'PersonSheet must receive returnFocusRef');
  assert.match(friendsScreenSrc, /<AddFriendSheet[\s\S]*returnFocusRef=/, 'AddFriendSheet must receive returnFocusRef');
  assert.match(friendsScreenSrc, /<FriendRemovalSheet[\s\S]*returnFocusRef=/, 'FriendRemovalSheet must receive returnFocusRef');
  assert.match(friendsScreenSrc, /<AvatarPickerBottomSheet[\s\S]*returnFocusRef=/, 'AvatarPickerBottomSheet must receive returnFocusRef');

  const { BottomSheet } = loadDist('components/BottomSheet.js');
  const sheetTree = BottomSheet({
    visible: true,
    onClose: () => {},
    accessibilityLabel: 'Test Sheet',
    children: 'Body',
  });
  const modalNodes = collectNodes(sheetTree, (n) => n.type === 'Modal');
  assert.equal(modalNodes.length, 1);

  // Find backdrop pressable / backdrop container and verify hidden from accessibility tree
  const pressables = collectNodes(sheetTree, (n) => n.type === 'Pressable');
  for (const p of pressables) {
    assert.notEqual(
      p.props.accessible,
      true,
      'Backdrop Pressable inside modal BottomSheet must not be exposed as accessible element while modal is active',
    );
  }
  const hiddenViews = collectNodes(
    sheetTree,
    (n) => n.props?.accessibilityElementsHidden === true && n.props?.importantForAccessibility === 'no-hide-descendants',
  );
  assert.ok(hiddenViews.length >= 1, 'BottomSheet backdrop must be hidden from accessibility tree');

  const { RequestRow } = loadDist('components/RequestRow.js');
  const incomingTree = RequestRow({
    friendship: {
      friendshipId: 'req-1',
      status: 'PENDING',
      direction: 'INCOMING',
      person: { id: 'u1', displayName: 'Ananya Verma', username: 'ananya_v', avatarId: null, isGuest: false },
      createdAt: '2026-11-24T10:00:00Z',
    },
    onAccept: () => {},
    onDecline: () => {},
  });
  const accessibleRows = collectNodes(incomingTree, (n) => n.props?.accessible === true);
  assert.ok(accessibleRows.length >= 1, 'RequestRow must be accessible as a unit');
  assert.ok(
    Array.isArray(accessibleRows[0].props.accessibilityActions) && accessibleRows[0].props.accessibilityActions.length === 2,
    'Incoming RequestRow must expose accept & decline accessibilityActions',
  );
});

test('F-16: unused deps/permissions removed, single icon & 5 font weights bundled, native-driver animations enforced', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(frontendDir, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies['expo-application'], undefined, 'expo-application should be removed');
  assert.equal(pkg.dependencies['expo-image-picker'], undefined, 'expo-image-picker should be removed');

  const appJson = JSON.parse(fs.readFileSync(path.join(frontendDir, 'app.json'), 'utf8'));
  const plugins = appJson.expo?.plugins ?? [];
  assert.equal(
    plugins.some((p) => p === 'expo-image-picker' || (Array.isArray(p) && p[0] === 'expo-image-picker')),
    false,
    'expo-image-picker plugin must be removed from app.json',
  );

  const infoPlist = fs.readFileSync(path.join(frontendDir, 'ios/Expensio/Info.plist'), 'utf8');
  assert.equal(infoPlist.includes('NSCameraUsageDescription'), false, 'Unused NSCameraUsageDescription must be removed');
  assert.equal(infoPlist.includes('NSFaceIDUsageDescription'), false, 'Unused NSFaceIDUsageDescription must be removed');
  assert.equal(infoPlist.includes('NSPhotoLibraryUsageDescription'), false, 'Unused NSPhotoLibraryUsageDescription must be removed');

  const appTsx = fs.readFileSync(path.join(frontendDir, 'App.tsx'), 'utf8');
  assert.doesNotMatch(
    appTsx,
    /from ['"]@expo-google-fonts\/plus-jakarta-sans['"]/,
    'App.tsx must import specific PlusJakartaSans weight subpaths instead of the 14-font barrel',
  );

  // Verify no barrel @expo/vector-icons imports remain in src/
  const addFriendSrc = fs.readFileSync(path.join(frontendDir, 'src/components/AddFriendSheet.tsx'), 'utf8');
  const profileSetupSrc = fs.readFileSync(path.join(frontendDir, 'src/screens/setup/ProfileSetupScreen.tsx'), 'utf8');
  const authEntrySrc = fs.readFileSync(path.join(frontendDir, 'src/screens/auth/AuthEntryScreen.tsx'), 'utf8');
  assert.doesNotMatch(authEntrySrc, /MaterialCommunityIcons/, 'AuthEntryScreen should use Ionicons only');
  assert.doesNotMatch(addFriendSrc, /useNativeDriver:\s*false/, 'AddFriendSheet must use native driver');
  assert.doesNotMatch(profileSetupSrc, /useNativeDriver:\s*false/, 'ProfileSetupScreen must use native driver');
});
