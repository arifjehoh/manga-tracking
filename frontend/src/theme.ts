import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: false,
}

export const theme = extendTheme({
  config,
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
        fontSize: 'sm', // Set default to small
      },
    }),
  },
  components: {
    Text: {
      defaultProps: {
        fontSize: 'sm',
      },
    },
    Button: {
      defaultProps: {
        size: 'sm',
      },
    },
    Input: {
      defaultProps: {
        size: 'sm',
      },
    },
    Select: {
      defaultProps: {
        size: 'sm',
      },
    },
  },
})
