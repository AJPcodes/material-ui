import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import EventListener from 'react-event-listener';
import { polyfill } from 'react-lifecycles-compat';
import withStyles from '../styles/withStyles';
import { duration } from '../styles/transitions';
import ClickAwayListener from '../utils/ClickAwayListener';
import { capitalize, createChainedFunction } from '../utils/helpers';
import Slide from '../transitions/Slide';
import SnackbarContent from './SnackbarContent';

export const styles = theme => {
  const gutter = theme.spacing.unit * 3;
  const top = { top: 0 };
  const bottom = { bottom: 0 };
  const right = { justifyContent: 'flex-end' };
  const left = { justifyContent: 'flex-start' };
  const topSpace = { top: gutter };
  const bottomSpace = { bottom: gutter };
  const rightSpace = { right: gutter };
  const leftSpace = { left: gutter };
  const center = {
    left: '50%',
    right: 'auto',
    transform: 'translateX(-50%)',
  };

  return {
    root: {
      zIndex: theme.zIndex.snackbar,
      position: 'fixed',
      display: 'flex',
      left: 0,
      right: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    anchorOriginTopCenter: {
      ...top,
      [theme.breakpoints.up('md')]: {
        ...center,
      },
    },
    anchorOriginBottomCenter: {
      ...bottom,
      [theme.breakpoints.up('md')]: {
        ...center,
      },
    },
    anchorOriginTopRight: {
      ...top,
      ...right,
      [theme.breakpoints.up('md')]: {
        left: 'auto',
        ...topSpace,
        ...rightSpace,
      },
    },
    anchorOriginBottomRight: {
      ...bottom,
      ...right,
      [theme.breakpoints.up('md')]: {
        left: 'auto',
        ...bottomSpace,
        ...rightSpace,
      },
    },
    anchorOriginTopLeft: {
      ...top,
      ...left,
      [theme.breakpoints.up('md')]: {
        right: 'auto',
        ...topSpace,
        ...leftSpace,
      },
    },
    anchorOriginBottomLeft: {
      ...bottom,
      ...left,
      [theme.breakpoints.up('md')]: {
        right: 'auto',
        ...bottomSpace,
        ...leftSpace,
      },
    },
  };
};

class Snackbar extends React.Component {
  static getDerivedStateFromProps(nextProps, prevState) {
    if (typeof prevState.exited === 'undefined') {
      return {
        exited: !nextProps.open,
      };
    }

    if (nextProps.open) {
      return {
        exited: false,
      };
    }

    return null;
  }

  state = {};

  componentDidMount() {
    if (this.props.open) {
      this.setAutoHideTimer();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.open !== this.props.open) {
      if (this.props.open) {
        this.setAutoHideTimer();
      } else {
        clearTimeout(this.timerAutoHide);
      }
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timerAutoHide);
  }

  // Timer that controls delay before snackbar auto hides
  setAutoHideTimer(autoHideDuration = null) {
    if (!this.props.onClose || this.props.autoHideDuration == null) {
      return;
    }

    clearTimeout(this.timerAutoHide);
    this.timerAutoHide = setTimeout(() => {
      if (!this.props.onClose || this.props.autoHideDuration == null) {
        return;
      }

      this.props.onClose(null, 'timeout');
    }, autoHideDuration || this.props.autoHideDuration || 0);
  }

  timerAutoHide = null;

  handleMouseEnter = (event: SyntheticUIEvent<>) => {
    if (this.props.onMouseEnter) {
      this.props.onMouseEnter(event);
    }
    this.handlePause();
  };

  handleMouseLeave = (event: SyntheticUIEvent<>) => {
    if (this.props.onMouseLeave) {
      this.props.onMouseLeave(event);
    }
    this.handleResume();
  };

  handleClickAway = (event: Event) => {
    if (this.props.onClose) {
      this.props.onClose(event, 'clickaway');
    }
  };

  // Pause the timer when the user is interacting with the Snackbar
  // or when the user hide the window.
  handlePause = () => {
    clearTimeout(this.timerAutoHide);
  };

  // Restart the timer when the user is no longer interacting with the Snackbar
  // or when the window is shown back.
  handleResume = () => {
    if (this.props.autoHideDuration != null) {
      if (this.props.resumeHideDuration !== undefined) {
        this.setAutoHideTimer(this.props.resumeHideDuration);
        return;
      }
      this.setAutoHideTimer((this.props.autoHideDuration || 0) * 0.5);
    }
  };

  handleExited = () => {
    this.setState({ exited: true });
  };

  render() {
    const {
      action,
      anchorOrigin: { vertical, horizontal },
      autoHideDuration,
      children,
      classes,
      className,
      ContentProps,
      disableWindowBlurListener,
      message,
      onClose,
      onEnter,
      onEntered,
      onEntering,
      onExit,
      onExited,
      onExiting,
      onMouseEnter,
      onMouseLeave,
      open,
      resumeHideDuration,
      transition: TransitionProp,
      transitionDuration,
      TransitionProps,
      ...other
    } = this.props;

    // So we only render active snackbars.
    if (!open && this.state.exited) {
      return null;
    }

    return (
      <ClickAwayListener onClickAway={this.handleClickAway}>
        <div
          className={classNames(
            classes.root,
            classes[`anchorOrigin${capitalize(vertical)}${capitalize(horizontal)}`],
            className,
          )}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
          {...other}
        >
          <EventListener
            target="window"
            onFocus={disableWindowBlurListener ? undefined : this.handleResume}
            onBlur={disableWindowBlurListener ? undefined : this.handlePause}
          />
          <TransitionProp
            appear
            in={open}
            onEnter={onEnter}
            onEntered={onEntered}
            onEntering={onEntering}
            onExit={onExit}
            onExited={createChainedFunction(this.handleExited, onExited)}
            onExiting={onExiting}
            timeout={transitionDuration}
            direction={vertical === 'top' ? 'down' : 'up'}
            {...TransitionProps}
          >
            {children || <SnackbarContent message={message} action={action} {...ContentProps} />}
          </TransitionProp>
        </div>
      </ClickAwayListener>
    );
  }
}

Snackbar.propTypes = {
  /**
   * The action to display.
   */
  action: PropTypes.node,
  /**
   * The anchor of the `Snackbar`.
   */
  anchorOrigin: PropTypes.shape({
    horizontal: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.oneOf(['left', 'center', 'right']),
    ]),
    vertical: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['top', 'center', 'bottom'])]),
  }),
  /**
   * The number of milliseconds to wait before automatically calling the
   * `onClose` function. `onClose` should then set the state of the `open`
   * prop to hide the Snackbar. This behavior is disabled by default with
   * the `null` value.
   */
  autoHideDuration: PropTypes.number,
  /**
   * If you wish the take control over the children of the component you can use this property.
   * When used, you replace the `SnackbarContent` component with the children.
   */
  children: PropTypes.element,
  /**
   * Useful to extend the style applied to components.
   */
  classes: PropTypes.object.isRequired,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * Properties applied to the `SnackbarContent` element.
   */
  ContentProps: PropTypes.object,
  /**
   * If `true`, the `autoHideDuration` timer will expire even if the window is not focused.
   */
  disableWindowBlurListener: PropTypes.bool,
  /**
   * When displaying multiple consecutive Snackbars from a parent rendering a single
   * <Snackbar/>, add the key property to ensure independent treatment of each message.
   * e.g. <Snackbar key={message} />, otherwise, the message may update-in-place and
   * features such as autoHideDuration may be canceled.
   */
  key: PropTypes.any,
  /**
   * The message to display.
   */
  message: PropTypes.node,
  /**
   * Callback fired when the component requests to be closed.
   * Typically `onClose` is used to set state in the parent component,
   * which is used to control the `Snackbar` `open` prop.
   * The `reason` parameter can optionally be used to control the response to `onClose`,
   * for example ignoring `clickaway`.
   *
   * @param {object} event The event source of the callback
   * @param {string} reason Can be:`"timeout"` (`autoHideDuration` expired) or: `"clickaway"`
   */
  onClose: PropTypes.func,
  /**
   * Callback fired before the transition is entering.
   */
  onEnter: PropTypes.func,
  /**
   * Callback fired when the transition has entered.
   */
  onEntered: PropTypes.func,
  /**
   * Callback fired when the transition is entering.
   */
  onEntering: PropTypes.func,
  /**
   * Callback fired before the transition is exiting.
   */
  onExit: PropTypes.func,
  /**
   * Callback fired when the transition has exited.
   */
  onExited: PropTypes.func,
  /**
   * Callback fired when the transition is exiting.
   */
  onExiting: PropTypes.func,
  /**
   * @ignore
   */
  onMouseEnter: PropTypes.func,
  /**
   * @ignore
   */
  onMouseLeave: PropTypes.func,
  /**
   * If true, `Snackbar` is open.
   */
  open: PropTypes.bool,
  /**
   * The number of milliseconds to wait before dismissing after user interaction.
   * If `autoHideDuration` property isn't specified, it does nothing.
   * If `autoHideDuration` property is specified but `resumeHideDuration` isn't,
   * we default to `autoHideDuration / 2` ms.
   */
  resumeHideDuration: PropTypes.number,
  /**
   * Transition component.
   */
  transition: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  /**
   * The duration for the transition, in milliseconds.
   * You may specify a single timeout for all transitions, or individually with an object.
   */
  transitionDuration: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({ enter: PropTypes.number, exit: PropTypes.number }),
  ]),
  /**
   * Properties applied to the `Transition` element.
   */
  TransitionProps: PropTypes.object,
};

Snackbar.defaultProps = {
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'center',
  },
  disableWindowBlurListener: false,
  transition: Slide,
  transitionDuration: {
    enter: duration.enteringScreen,
    exit: duration.leavingScreen,
  },
};

export default withStyles(styles, { flip: false, name: 'MuiSnackbar' })(polyfill(Snackbar));
