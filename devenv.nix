{ pkgs, lib, config, inputs, ... }:
let 
  pkgs_go_1_23 = import inputs.nixpkgs_go_1_23 { system = pkgs.stdenv.system; };
in {
  packages = [ 
    # TODO remove once we enable languages.go
    pkgs_go_1_23.go_1_23
    # Needed for node gyp and pcap
    pkgs.python311
    pkgs.python311Packages.libpcap
  ];
  languages.javascript = rec {
    package = pkgs.nodejs_20;
    enable = true;
    yarn = {
      enable = true;
      install.enable = true;
      package = package.pkgs.yarn;
    };
  };

  # TODO enable this once 1.23 is merged upstream
  # languages.go = {
  #   package = pkgs_go.go_1_23;
  #   enable = true;
  # };
}
