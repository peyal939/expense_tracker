import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { expensesAPI, budgetsAPI } from '../services/api'

const OnboardingContext = createContext(null)

export function OnboardingProvider({ children }) {
  const { user } = useAuth()
  const [onboardingState, setOnboardingState] = useState({
    isFirstLogin: false,
    hasSeenWelcome: false,
    hasAddedFirstExpense: false,
    hasSetBudget: false,
    hasViewedReports: false,
    expenseCount: 0,
    showFeatureTips: false,
  })

  // Load onboarding state from localStorage AND verify with API
  useEffect(() => {
    if (user) {
      const storageKey = `onboarding_${user.id}`
      const savedState = localStorage.getItem(storageKey)
      
      let initialState = savedState ? JSON.parse(savedState) : {
        isFirstLogin: true,
        hasSeenWelcome: false,
        hasAddedFirstExpense: false,
        hasSetBudget: false,
        hasViewedReports: false,
        expenseCount: 0,
        showFeatureTips: false,
      }
      
      setOnboardingState(initialState)
      
      // Verify with API - user may have data from another device/session
      checkActualProgress(initialState, storageKey)
    }
  }, [user?.id])

  // Check actual progress from API
  const checkActualProgress = async (currentState, storageKey) => {
    try {
      // Check if user has expenses
      const expensesRes = await expensesAPI.list({ limit: 1 })
      const expensesData = expensesRes.data?.results ?? expensesRes.data
      const hasExpenses = Array.isArray(expensesData) && expensesData.length > 0
      
      // Check if user has budget set
      const now = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      let hasBudget = false
      try {
        const budgetRes = await budgetsAPI.monthly.getCurrent(month)
        hasBudget = budgetRes.data?.total_budget > 0
      } catch (e) {
        // Budget not set, that's fine
      }
      
      // Update state if API shows more progress than localStorage
      const updates = {}
      if (hasExpenses && !currentState.hasAddedFirstExpense) {
        updates.hasAddedFirstExpense = true
        updates.expenseCount = Math.max(currentState.expenseCount, 1)
      }
      if (hasBudget && !currentState.hasSetBudget) {
        updates.hasSetBudget = true
      }
      
      if (Object.keys(updates).length > 0) {
        const newState = { ...currentState, ...updates }
        setOnboardingState(newState)
        localStorage.setItem(storageKey, JSON.stringify(newState))
      }
    } catch (error) {
      console.error('Error checking onboarding progress:', error)
    }
  }

  // Save state to localStorage
  const updateOnboardingState = (updates) => {
    if (!user) return
    
    const newState = { ...onboardingState, ...updates }
    setOnboardingState(newState)
    localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(newState))
  }

  const markWelcomeSeen = () => {
    updateOnboardingState({ hasSeenWelcome: true, isFirstLogin: false })
  }

  const markFirstExpenseAdded = () => {
    const newCount = onboardingState.expenseCount + 1
    updateOnboardingState({ 
      hasAddedFirstExpense: true, 
      expenseCount: newCount,
      showFeatureTips: newCount >= 3,
    })
  }

  const markBudgetSet = () => {
    updateOnboardingState({ hasSetBudget: true })
  }

  const markReportsViewed = () => {
    updateOnboardingState({ hasViewedReports: true })
  }

  const incrementExpenseCount = () => {
    const newCount = onboardingState.expenseCount + 1
    updateOnboardingState({ 
      expenseCount: newCount,
      showFeatureTips: newCount >= 3,
    })
  }

  const dismissFeatureTip = (tipId) => {
    const dismissedTips = JSON.parse(localStorage.getItem(`dismissed_tips_${user?.id}`) || '[]')
    if (!dismissedTips.includes(tipId)) {
      dismissedTips.push(tipId)
      localStorage.setItem(`dismissed_tips_${user?.id}`, JSON.stringify(dismissedTips))
    }
  }

  const isTipDismissed = (tipId) => {
    const dismissedTips = JSON.parse(localStorage.getItem(`dismissed_tips_${user?.id}`) || '[]')
    return dismissedTips.includes(tipId)
  }

  const resetOnboarding = () => {
    if (user) {
      localStorage.removeItem(`onboarding_${user.id}`)
      localStorage.removeItem(`dismissed_tips_${user.id}`)
      setOnboardingState({
        isFirstLogin: true,
        hasSeenWelcome: false,
        hasAddedFirstExpense: false,
        hasSetBudget: false,
        hasViewedReports: false,
        expenseCount: 0,
        showFeatureTips: false,
      })
    }
  }

  return (
    <OnboardingContext.Provider value={{
      ...onboardingState,
      markWelcomeSeen,
      markFirstExpenseAdded,
      markBudgetSet,
      markReportsViewed,
      incrementExpenseCount,
      dismissFeatureTip,
      isTipDismissed,
      resetOnboarding,
    }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
