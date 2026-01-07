import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

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

  // Load onboarding state from localStorage on user change
  useEffect(() => {
    if (user) {
      const storageKey = `onboarding_${user.id}`
      const savedState = localStorage.getItem(storageKey)
      
      if (savedState) {
        setOnboardingState(JSON.parse(savedState))
      } else {
        // First time user
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
  }, [user?.id])

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
