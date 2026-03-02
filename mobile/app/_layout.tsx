import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { usePathname, Link } from 'expo-router'
import { Home as HomeIcon, PlusCircle, Clock, Settings, Search } from 'lucide-react-native'

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#f3f4f6',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'FoodLog',
            headerRight: () => (
              <Link href="/search" asChild>
                <TouchableOpacity style={{ marginRight: 16 }}>
                  <Search size={24} color="#fff" />
                </TouchableOpacity>
              </Link>
            ),
          }}
        />
        <Stack.Screen
          name="add"
          options={{
            title: 'Log Food',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            title: 'History',
            headerRight: () => (
              <Link href="/search" asChild>
                <TouchableOpacity style={{ marginRight: 16 }}>
                  <Search size={24} color="#fff" />
                </TouchableOpacity>
              </Link>
            ),
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            title: 'Search',
          }}
        />
        <Stack.Screen
          name="presets"
          options={{
            title: 'Food Presets',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings',
          }}
        />
        <Stack.Screen
          name="entry/[id]"
          options={{
            title: 'Entry Details',
          }}
        />
      </Stack>
    </View>
  )
}

function TabBar() {
  const pathname = usePathname()
  
  const tabs = [
    { path: '/', icon: HomeIcon, label: 'Today' },
    { path: '/add', icon: PlusCircle, label: 'Add' },
    { path: '/history', icon: Clock, label: 'History' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]
  
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path
        const Icon = tab.icon
        const isAdd = tab.path === '/add'
        
        if (isAdd) {
          return (
            <Link key={tab.path} href={tab.path as any} asChild>
              <TouchableOpacity style={styles.addButton}>
                <Icon size={28} color="#fff" />
              </TouchableOpacity>
            </Link>
          )
        }
        
        return (
          <Link key={tab.path} href={tab.path as any} asChild>
            <TouchableOpacity style={styles.tab}>
              <Icon size={24} color={isActive ? '#2563eb' : '#6b7280'} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          </Link>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    padding: 4,
    minWidth: 60,
  },
  tabLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
})