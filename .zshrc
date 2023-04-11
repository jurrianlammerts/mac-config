# To display folder name as tab title
HOSTNAME=""
DISABLE_AUTO_TITLE="true"

# Let zsh launch with the custom title.
window_title="\033]0;${PWD##*/}\007"
echo -ne "$window_title"

# Refresh the custome title when the directory changes. Changed fro$
function chpwd () {
  window_title="\033]0;${PWD##*/}\007"
  echo -ne "$window_title"
}

# include Z, yo
. ~/z.sh

# Set name of the theme to load --- if set to "random", it will
# load a random theme each time oh-my-zsh is loaded, in which case,
# to know which specific one was loaded, run: echo $RANDOM_THEME
# See https://github.com/robbyrussell/oh-my-zsh/wiki/Themes
ZSH_THEME="refined"

# Standard plugins can be found in ~/.oh-my-zsh/plugins/*
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(git zsh-autosuggestions zsh-syntax-highlighting z )

# Path to your oh-my-zsh installation.
export ZSH="/Users/Jurrian/.oh-my-zsh"

source $ZSH/oh-my-zsh.sh

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

source /usr/local/share/chruby/chruby.sh
source /usr/local/share/chruby/auto.sh
chruby ruby-2.7.2
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
export ANDROID_NDK_HOME=/usr/local/opt/android-ndk

export NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"
export PATH="/opt/homebrew/bin:${PATH}"

export AUTH_TOKEN=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
export NPM_TOKEN=glpat-U4cZZPpJ4s6NuQ6rwfSxY

